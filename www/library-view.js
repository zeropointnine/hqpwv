import AlbumUtil from './album-util.js';
import DataUtil from './data-util.js';
import LibraryAlbumOptionsView from './library-album-options-view.js';
import LibraryAlbumsList from './library-albums-list.js';
import LibrarySearchPanel from './library-search-panel.js';
import LibrarySearchList from './library-search-list.js';
import LibraryDataUtil from './library-data-util.js';
import Model from './model.js';
import Service from './service.js';
import Settings from './settings.js';
import Subview from './subview.js';
import TopBarUtil from './top-bar-util.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 * Composite view containing two `LibraryContentList` subclasses.
 * Lives underneath any other main views.
 */
export default class LibraryView extends Subview {

  $title;
  $itemCount;
  $spinner;

  albumOptionsView; // dropdowns + search button
  $searchButton;
  $searchCloseButton;

  searchPanel;

  albumsList;
  searchList;

  constructor() {
    super($("#libraryView"));
    this.$title = this.$el.find('#libraryTitle');
    this.$itemCount = this.$el.find('#libraryNumbers');
    this.$searchButton = this.$el.find('#librarySearchButton');
    this.$searchCloseButton = this.$el.find('#librarySearchCloseButton');
    this.$spinner = this.$el.find('#librarySpinner');

    this.albumOptionsView = new LibraryAlbumOptionsView(this.$el.find("#libraryAlbumOptionsView"));
    this.albumsList = new LibraryAlbumsList(this.$el.find('#libraryAlbumsList'));
    this.searchPanel = new LibrarySearchPanel(this.$el.find("#librarySearchPanel"));
    this.searchList = new LibrarySearchList(this.$el.find('#librarySearchList'));

    this.$searchButton.on('click tap', () => this.openSearch());
    this.$searchCloseButton.on('click tap', () => this.closeSearch());
    Util.addAppListener(this, 'model-library-updated', this.onModelLibraryUpdated);
    Util.addAppListener(this, 'library-albums-filter-changed library-albums-list-populated',
        () => this.updateHeaderText(false));
    Util.addAppListener(this, 'library-search-view-populated',
        () => this.updateHeaderText(true));
    Util.addAppListener(this, 'library-search', this.onSearch);
  }

  setSpinnerState(b) {
    if (b) {
      this.$el.addClass('isDisabled');
      ViewUtil.setDisplayed(this.$spinner, true);
      this.$spinner.css('opacity', 1);
    } else {
      this.$el.removeClass('isDisabled');
      ViewUtil.setDisplayed(this.$spinner, false);
    }
  }

  showFirstTime() {
    this.setSpinnerState(false);
    ViewUtil.setVisible(this.albumsList.$el, true);

    this.searchList.hide();
    this.albumsList.show();
    this.albumsList.update();
	}

  /**
   * Animates in search view state.
   */
  openSearch() {
    $(document).trigger('disable-user-input');
    TopBarUtil.returnSubviewHeader(true)
    this.albumsList.hide(false, () => {
      this.updateHeaderText(true);
      ViewUtil.setDisplayed(this.albumOptionsView.$el, false);
      ViewUtil.setDisplayed(this.$searchCloseButton, true);
      this.searchPanel.show();
      this.searchList.show();
      $(document).trigger('enable-user-input');
    });
  }

  /**
   * Shows search view state synchronously, with list populated.
   */
  openSearchSync(searchType, value) {
    TopBarUtil.returnSubviewHeader(true)
    this.updateHeaderText(true);
    ViewUtil.setDisplayed(this.albumOptionsView.$el, false);
    ViewUtil.setDisplayed(this.$searchCloseButton, true);
    this.albumsList.hide(true);
    this.searchPanel.show(searchType, value, true);
    this.searchList.setSearchTypeAndValue(searchType, value);
    this.searchList.show(true);
  }

  /**
   * Animates out search view state.
   */
  closeSearch() {
    $(document).trigger('disable-user-input');
    TopBarUtil.returnSubviewHeader(true)
    this.searchList.hide();
    this.searchPanel.hide(() => {
      this.$el[0].scrollTop = 0;
      ViewUtil.setDisplayed(this.$searchCloseButton, false);
      ViewUtil.setDisplayed(this.albumOptionsView.$el, 'flex');
      this.albumsList.update();
      this.albumsList.show();
      this.updateHeaderText(false);
      $(document).trigger('enable-user-input');
    });
  }

  onModelLibraryUpdated() {
    this.albumsList.setAlbums(Model.library.albums);
    this.searchList.setAlbums(Model.library.albums);
  }

  onSearch(type, value) {
    this.albumsList.clear();
    this.albumsList.hide();
    this.searchList.show();
    this.searchList.setSearchTypeAndValue(type, value);
  }

  /** Returns true if handled/'eaten' */
  onEscape() {
    if (ViewUtil.isDisplayed(this.searchPanel.$el)) {
      this.closeSearch();
      return true;
    }
    return false;
  }

  updateHeaderText(isForSearch) {

    const headingText = isForSearch ? 'Search' : 'Library';
    this.$title.text(headingText);

    let count;
    if (isForSearch) {
      const isEmpty = (this.searchList.$el[0].childNodes.length == 0);
      count = isEmpty ? 0 : this.searchList.getItemCount();
    } else {
      count = this.albumsList.filteredSortedAlbums.length;
    }

    let countText;
    if (isForSearch && count == 0) {
      countText = '';
    } else {
      const isTracks = isForSearch &&
          (this.searchList.getSearchType() == 'track' || this.searchList.getSearchType() == 'trackFavorites');
      let suffix;
      if (isTracks) {
        suffix = (count == 1) ? ' track' : ' tracks';
      } else {
        suffix = (count == 1) ? ' album' : ' albums';
      }
      countText = '(' + count + suffix + ')';
    }
    this.$itemCount.text(countText);
  }
}
