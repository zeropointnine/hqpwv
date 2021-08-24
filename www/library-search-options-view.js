import Settings from './settings.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class LibrarySearchOptionsView {

  $el;
  $closeButton;
  $input;
  $okButton;
  $checkboxArtist;
  $checkboxAlbum;
  $checkboxTrack;
  
  _searchType = '';

  constructor($el) {
    this.$el = $el;
    this.$closeButton = $el.find('#librarySearchCloseButton');
    this.$input = $el.find('#librarySearchInput');
    this.$input[0].value = '';
    this.$okButton = $el.find('#librarySearchOkButton');
    this.$checkboxArtist = $el.find('#searchArtistCheckbox');
    this.$checkboxAlbum = $el.find('#searchAlbumCheckbox');
    this.$checkboxTrack = $el.find('#searchTrackCheckbox');

    this.$closeButton.on('click tap', () => $(document).trigger('library-search-close-button'));
    this.$okButton.on('click tap', this.onOkButton);
    this.$checkboxArtist.on('click tap', this.onCheckbox);
    this.$checkboxAlbum.on('click tap', this.onCheckbox);
    this.$checkboxTrack.on('click tap', this.onCheckbox);

    this.hide();
  }

  show() {
    ViewUtil.setDisplayed(this.$el, true);

    this.searchType = Settings.librarySearchType;
    this.$input.focus();
    this.$input.on('input', this.onInputInput);
    this.$input.on('keyup', this.onInputKeyUp);

    // no idea
    setTimeout(() => {
      this.$input[0].value = Settings.librarySearchValue;
      this.updateOkButton();
    }, 100);
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
    this.$input.off('input', this.onInputInput);
    this.$input.off('keyup', this.onInputKeyUp);
  }

  get searchType() {
    return this._searchType;
  }

  /**
   * This updates the checkboxes.
   */
  set searchType(value) {
    this._searchType = value;

    let $checkbox;
    switch (this._searchType) {
      case 'artist':
        $checkbox = this.$checkboxArtist;
        break;
      case 'album':
        $checkbox = this.$checkboxAlbum;
        break;
      case 'track':
        $checkbox = this.$checkboxTrack;
        break;
      default:
        break;
    }
    this.$checkboxArtist.removeClass('isChecked');
    this.$checkboxAlbum.removeClass('isChecked');
    this.$checkboxTrack.removeClass('isChecked');
    $checkbox.addClass('isChecked');
  }

  getMassagedText(str) {
    str = str.trim();
    return str;
  }

  updateOkButton() {
    const b = !!this.getMassagedText(this.$input[0].value);
    if (b) {
      this.$okButton.removeClass('isDisabled')
    } else {
      this.$okButton.addClass('isDisabled')
    }
  }

  onInputKeyUp = (e) => {
    if (e.keyCode == 13) {
      if (this.$okButton.css('pointer-events') != 'none') {
        this.$okButton.click();
      }
    } else if (e.keyCode == 27) {
      if (this.$input[0].value) {
        this.$input[0].value = '';
        this.updateOkButton();
      } else {
        $(document).trigger('app-do-escape');
      }
    }
  };

  onInputInput = (e) => {
    this.updateOkButton();
  };

  onOkButton = () => {
    const value = this.getMassagedText(this.$input[0].value);
    $(document).trigger('library-search', [this._searchType, value]);
  };

  onCheckbox = (e) => {
    let value;
    switch (e.currentTarget) {
      case this.$checkboxArtist[0]:
        value = 'artist';
        break;
      case this.$checkboxAlbum[0]:
        value = 'album';
        break;
      case this.$checkboxTrack[0]:
        value = 'track';
        break;
      default:
        return;
    }
    this.searchType = value;

    const text = this.getMassagedText(this.$input[0].value);
    if (text) {
      $(document).trigger('library-search', [this._searchType, text]);
    }
  };
}
