import AlbumUtil from './album-util.js';
import DataUtil from './data-util.js';
import LibraryAlbumOptionsView from './library-album-options-view.js';
import LibraryAlbumsView from './library-albums-view.js';
import LibrarySearchOptionsView from './library-search-options-view.js';
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
 * Library view containing a list of albums.
 * Is always visible under any other main views.
 */
export default class LibraryView extends Subview {

  $searchButton;
  $albumViewItemCount;
  $spinner;

  albumOptionsView;
  albumsView;
  searchOptionsView;
  searchView;

  constructor() {
    super($("#libraryView"));
    this.$searchButton = this.$el.find('#librarySearchButton');
    this.$albumViewItemCount = this.$el.find('#libraryNumbers');
    this.$spinner = this.$el.find('#librarySpinner');

    this.albumOptionsView = new LibraryAlbumOptionsView(this.$el.find("#libraryAlbumOptionsView"));
    this.albumsView = new LibraryAlbumsView(this.$el.find('#libraryAlbumsView'));
    this.searchOptionsView = new LibrarySearchOptionsView(this.$el.find("#librarySearchOptionsView"));
    this.searchView = new LibrarySearchView(this.$el.find('#librarySearchView'));

    this.$searchButton.on('click tap', this.onSearchButton);
    Util.addAppListener(this, 'model-library-updated', this.onModelLibraryUpdated);
    Util.addAppListener(this, 'library-search-close-button', this.showAlbumsView);
    Util.addAppListener(this, 'library-albums-view-populated', this.onAlbumViewPopulated);
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
    this.searchOptionsView.hide();
    this.searchView.hide();
    ViewUtil.setDisplayed(this.$albumViewItemCount, true);
    this.albumOptionsView.show();
    this.albumsView.show();
  }

  showSearchView() {
    this.albumsView.hide();
    this.albumOptionsView.hide();
    ViewUtil.setDisplayed(this.$albumViewItemCount, false);
    this.searchView.show();
    this.searchOptionsView.show();
    // update form controls to match search view values
    this.searchOptionsView.$input[0].value = this.searchView.lowercaseSearchTerm;
    this.searchOptionsView.updateOkButton();
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

  onAlbumViewPopulated(numItems) {
    this.$albumViewItemCount.text(`(${numItems}/${Model.library.albums.length})`);
  }

}
