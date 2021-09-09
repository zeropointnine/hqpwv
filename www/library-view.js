import AlbumUtil from './album-util.js';
import DataUtil from './data-util.js';
import LibraryAlbumOptionsView from './library-album-options-view.js';
import LibraryAlbumsView from './library-albums-view.js';
import LibrarySearchPanel from './library-search-panel.js';
import LibrarySearchView from './library-search-view.js';
import LibraryDataUtil from './library-data-util.js';
import Model from './model.js';
import Service from './service.js';
import Settings from './settings.js';
import Subview from './subview.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 * Composite view containing two `LibraryContentView` subclasses.
 * Lives underneath any other main views.
 */
export default class LibraryView extends Subview {

  $title;
  $itemCount;
  $searchButton;
  $searchCloseButton;
  $spinner;

  albumOptionsView;
  albumsView;
  searchPanel;
  searchView;

  constructor() {
    super($("#libraryView"));
    this.$title = this.$el.find('#libraryTitle');
    this.$itemCount = this.$el.find('#libraryNumbers');
    this.$searchButton = this.$el.find('#librarySearchButton');
    this.$searchCloseButton = this.$el.find('#librarySearchCloseButton');
    this.$spinner = this.$el.find('#librarySpinner');

    this.albumOptionsView = new LibraryAlbumOptionsView(this.$el.find("#libraryAlbumOptionsView"));
    this.albumsView = new LibraryAlbumsView(this.$el.find('#libraryAlbumsView'));
    this.searchPanel = new LibrarySearchPanel(this.$el.find("#librarySearchPanel"));
    this.searchView = new LibrarySearchView(this.$el.find('#librarySearchView'));

    this.$searchButton.on('click tap', this.onSearchButton);
    this.$searchCloseButton.on('click tap', () => this.showAlbumsView());
    Util.addAppListener(this, 'model-library-updated', this.onModelLibraryUpdated);
    Util.addAppListener(this, 'library-albums-filter-changed', this.updateHeaderText);
    Util.addAppListener(this, 'library-albums-view-populated', this.updateHeaderText);
    Util.addAppListener(this, 'library-search-view-populated', this.updateHeaderText);
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
    ViewUtil.setVisible(this.albumsView.$el, true);
    this.showAlbumsView();
	}

  showAlbumsView() {
    ViewUtil.setDisplayed(this.albumOptionsView.$el, 'flex');
    ViewUtil.setDisplayed(this.$searchCloseButton, false);
    this.searchPanel.hide();
    this.searchView.hide();
    this.searchView.clear();
    this.albumsView.show();
    this.updateHeaderText();
    ViewUtil.setFocus(this.$el);
  }

  showSearchView() {
    ViewUtil.setDisplayed(this.albumOptionsView.$el, false);
    ViewUtil.setDisplayed(this.$searchCloseButton, true);
    this.albumsView.hide();
    this.albumsView.clear();
    this.searchView.show();
    this.searchPanel.show();
    this.updateHeaderText();
  }

  onModelLibraryUpdated() {
    this.albumsView.setAlbums(Model.library.albums);
    this.searchView.setAlbums(Model.library.albums);
  }

  onSearchButton = () => {
    if (ViewUtil.isDisplayed(this.albumsView.$el)) {
      this.showSearchView();
    } else {
      this.showAlbumsView();
    }
  };

  /** Returns true if handled/'eaten' */
  onEscape() {
    if (ViewUtil.isDisplayed(this.searchView.$el)) {
      this.showAlbumsView();
      return true;
    }
    return false;
  }

  updateHeaderText() {
    const isSearch = ViewUtil.isDisplayed(this.searchView.$el);

    const headingText = isSearch ? 'Library Search' : 'Library';
    this.$title.text(headingText);

    const count = isSearch
        ? this.searchView.getItemCount()
        : this.albumsView.filteredSortedAlbums.length;

    let suffix;
    if (isSearch) {
      if (this.searchView.getSearchType() == 'track' || this.searchView.getSearchType() == 'trackFavorites') {
        suffix = ' tracks';
      } else {
        suffix = ' albums';
      }
    } else {
      suffix = ' albums'
    }

    const countText = '(' + count + suffix + ')';
    this.$itemCount.text(countText);
  }
}
