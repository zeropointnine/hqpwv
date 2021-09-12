import Settings from './settings.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class LibrarySearchPanel {

  $el;

  $artistsTabButton;
  $albumsTabButton;
  $genresTabButton;
  $tracksTabButton;

  $panelContent;
  $input;
  $okButton;

  $albumFavoritesButton;
  $trackFavoritesButton;

  _searchType = '';

  constructor($el) {
    this.$el = $el;
    this.$artistsTabButton = $el.find('#artistsTabButton');
    this.$albumsTabButton = $el.find('#albumsTabButton');
    this.$genresTabButton = $el.find('#genresTabButton');
    this.$tracksTabButton = $el.find('#tracksTabButton');
    this.$panelContent = $el.find('#searchPanelContent');
    this.$input = $el.find('#librarySearchInput');
    this.$okButton = $el.find('#librarySearchOkButton');
    this.$albumFavoritesButton = $el.find('#albumFavoritesButton');
    this.$trackFavoritesButton = $el.find('#trackFavoritesButton');

    this.$artistsTabButton.on('click tap', this.onTabButton);
    this.$albumsTabButton.on('click tap', this.onTabButton);
    this.$genresTabButton.on('click tap', this.onTabButton);
    this.$tracksTabButton.on('click tap', this.onTabButton);
    this.$okButton.on('click tap', this.onOkButton);
    this.$albumFavoritesButton.on('click tap', this.onAlbumFavoritesButton);
    this.$trackFavoritesButton.on('click tap', this.onTrackFavoritesButton);

    this.searchType = 'artist';

    this.hide();
  }

  show(type=null, value=null) {
    if (!type) {
      type = Settings.librarySearchType;
      value = Settings.librarySearchValue || '';
    }
    ViewUtil.setDisplayed(this.$el, true);
    this.searchType = type;
    this.$input[0].value = value;

    this.$input.on('input', this.onInputInput);
    this.$input.on('keyup', this.onInputKeyUp);
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
    this.$input.off('input', this.onInputInput);
    this.$input.off('keyup', this.onInputKeyUp);
  }

  /**
   * Sets the search type and updates view state (complicated).
   */
  set searchType(value) {

    this._searchType = value;

    this.$artistsTabButton.removeClass('isSelected');
    this.$albumsTabButton.removeClass('isSelected');
    this.$genresTabButton.removeClass('isSelected');
    this.$tracksTabButton.removeClass('isSelected');
    this.$albumFavoritesButton.removeClass('isSelected');
    this.$trackFavoritesButton.removeClass('isSelected');

    let $el;
    switch (this._searchType) {
      case 'artist':
        $el = this.$artistsTabButton;
        break;
      case 'album':
        $el = this.$albumsTabButton;
        break;
      case 'genre':
        $el = this.$genresTabButton;
        break;
      case 'track':
        $el = this.$tracksTabButton;
        break;
      case 'albumFavorites':
        $el = this.$albumFavoritesButton;
        break;
      case 'trackFavorites':
        $el = this.$trackFavoritesButton;
        break;
      default:
        cl('warning logic');
        return;
    }
    $el.addClass('isSelected');

    switch (this._searchType) {
      case 'artist':
      case 'album':
      case 'genre':
      case 'track':
        this.$panelContent.addClass('isEnabled');
        break;
      case 'albumFavorites':
      case 'trackFavorites':
        this.$panelContent.removeClass('isEnabled');
        break;
      default:
        cl('warning logic');
        return;
    }
  }

  getMassagedInput() {
    let s = this.$input[0].value;
    s = s.trim(); // todo other chars?
    return s;
  }

  massageInput() {
    const s = this.getMassagedInput();
    this.$input[0].value = s;
  }

  onInputKeyUp = (e) => {
    if (e.keyCode == 13) {
      this.$okButton.click();
    } else if (e.keyCode == 27) {
      $(document).trigger('app-do-escape');
    }
  };

  onInputInput = (e) => { };

  onOkButton = () => {
    this.massageInput();
    const value = this.getMassagedInput();
    $(document).trigger('library-search', [this._searchType, value]);
  };

  onTabButton = (e) => {
    const value = $(e.currentTarget).attr('data-value') ;
    this.searchType = value;
    this.massageInput();
    this.$okButton.click();
  };

  onAlbumFavoritesButton = (e) => {
    this.searchType = 'albumFavorites';
    $(document).trigger('library-search', [this._searchType]);
  };

  onTrackFavoritesButton = (e) => {
    this.searchType = 'trackFavorites';
    $(document).trigger('library-search', [this._searchType]);
  };
}
