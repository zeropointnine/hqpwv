import Settings from './settings.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class LibrarySearchPanel {

  $el;

  $artistsTabButton;
  $albumsTabButton;
  $genresTabButton;
  $yearsTabButton;
  $tracksTabButton;
  tabButtons$;

  $tabContent;
  $input;
  $okButton;

  $albumFavoritesButton;
  $trackFavoritesButton;

  _searchType;
  _tabType; // 'enum' subset of searchType. tricky.

  constructor($el) {
    this.$el = $el;
    this.$artistsTabButton = $el.find('#artistsTabButton');
    this.$albumsTabButton = $el.find('#albumsTabButton');
    this.$genresTabButton = $el.find('#genresTabButton');
    this.$yearsTabButton = $el.find('#yearsTabButton');
    this.$tracksTabButton = $el.find('#tracksTabButton');
    this.tabButtons$ = [ this.$artistsTabButton, this.$albumsTabButton, this.$genresTabButton, this.$yearsTabButton, this.$tracksTabButton];
    this.$tabContent = $el.find('#searchTabContent');
    this.$input = $el.find('#librarySearchInput');
    this.$okButton = $el.find('#librarySearchOkButton');
    this.$albumFavoritesButton = $el.find('#albumFavoritesButton');
    this.$trackFavoritesButton = $el.find('#trackFavoritesButton');

    this.$artistsTabButton.on('click tap', this.onTabButton);
    this.$albumsTabButton.on('click tap', this.onTabButton);
    this.$genresTabButton.on('click tap', this.onTabButton);
    this.$yearsTabButton.on('click tap', this.onTabButton);
    this.$tracksTabButton.on('click tap', this.onTabButton);
    this.$okButton.on('click tap', this.onOkButton);
    this.$albumFavoritesButton.on('click tap', this.onAlbumFavoritesButton);
    this.$trackFavoritesButton.on('click tap', this.onTrackFavoritesButton);
    Util.addAppListener(this, 'library-search-list-cleared', () => this.searchType = null);

    this.$tabContent.addClass('isEnabled');

    this.tabType = 'artist'; // default

    this.hide();
  }

  show(type=null, value=null, now=false) {
    this.searchType = type;
    this.$input[0].value = value;

    this.$input.on('input', this.onInputInput);
    this.$input.on('keyup', this.onInputKeyUp);

    ViewUtil.setDisplayed(this.$el, true);

    if (now) {
      ViewUtil.setCssSync(this.$el, () => this.$el.css('opacity', 1));
    } else {
      ViewUtil.animateCss(this.$el,
          () => this.$el.css('opacity', 0),
          () => this.$el.css('opacity', 1),
          null);
    }
  }

  hide(callback) {
    if (!ViewUtil.isDisplayed(this.$el)) {
      if (callback) {
        callback();
      }
      return;
    }
    this.$input.off('input', this.onInputInput);
    this.$input.off('keyup', this.onInputKeyUp);

    ViewUtil.animateCss(this.$el,
        () => this.$el.css('opacity', 1),
        () => this.$el.css('opacity', 0),
        () => {
          ViewUtil.setDisplayed(this.$el, false)
          if (callback) {
            callback();
          }
        });
  }

  /**
   * Sets the search type and updates view state (complicated).
   */
  set searchType(value) {

    this._searchType = value;

    for (const $tabButton of this.tabButtons$) {
      $tabButton.removeClass('isSelected');
    }
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
      case 'year':
        $el = this.$yearsTabButton;
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
        return;
    }
    if ($el) {
      $el.addClass('isSelected');
    }

    switch (this._searchType) {
      case 'artist':
      case 'album':
      case 'genre':
      case 'year':
      case 'track':
        this.tabType = this._searchType;
        break;
      case 'albumFavorites':
      case 'trackFavorites':
        this.$input[0].value = '';
        break;
      default:
        return;
    }
  }

  set tabType(type) {

    this._tabType = type;

    // update .isOn and placeholder text
    let placeholder;
    let $tabButton;
    switch (this._tabType) {
      case 'artist':
        $tabButton = this.$artistsTabButton;
        placeholder = 'Search album artist names';
        break;
      case 'album':
        $tabButton = this.$albumsTabButton;
        placeholder = 'Search album titles';
        break;
      case 'genre':
        $tabButton = this.$genresTabButton;
        placeholder = 'Search album genres';
        break;
      case 'year':
        $tabButton = this.$yearsTabButton;
        placeholder = 'Search album year (eg, 2012 or 1968-1972)';
        break;
      case 'track':
        $tabButton = this.$tracksTabButton;
        placeholder = 'Search track titles';
        break;
      default:
        cl('warning logic');
        return;
    }
    for (const $b of this.tabButtons$) {
      $b.removeClass('isOn');
    }
    $tabButton.addClass('isOn');
    this.$input.attr('placeholder', placeholder);
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
    $(document).trigger('library-search', [this._tabType, value]);
    this.searchType = this._tabType;
  };

  onTabButton = (e) => {
    const value = $(e.currentTarget).attr('data-value') ;
    if (value == this._searchType) {
      return;
    }
    this.tabType = value;

    ViewUtil.setFocus(this.$input[0]);
    this.$input[0].value = '';
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
