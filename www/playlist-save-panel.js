import AppUtil from './app-util.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import ToastView from './toast-view.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class PlaylistSavePanel {

  $el;
  $closeButton;
  $saveButton;
  $input;

  playlistArray;

  constructor($el) {
  	this.$el = $el;
    this.$closeButton = this.$el.find('#playlistSaveCloseButton');
    this.$saveButton = this.$el.find('#playlistSaveOkayButton');
    this.$input = this.$el.find('#playlistSaveInput');
    this.$input[0].value = '';

    this.$closeButton.on('click tap', () => this.hide());
    this.$input.on('input', () => this.updateSaveButton());
    this.$input.on('keyup', this.onInputKeyUp);
    this.$saveButton.on('click tap', this.onSaveButton);
  }

  show() {
    if (Model.playlist.array.length == 0) {
      return; // shdnt happen
    }
    this.playlistArray = [...Model.playlist.array];

    ViewUtil.setDisplayed(this.$el, true);
    this.updateSaveButton();
    this.$input.focus();
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
  }

  updateSaveButton() {
    const b = !!this.getSanitizedText(this.$input[0].value);
    if (b) {
      this.$saveButton.removeClass('isDisabled')
    } else {
      this.$saveButton.addClass('isDisabled')
    }
  }

  getSanitizedText(str) {
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    str = str.trim();
    return str;
  }

  onInputKeyUp = (e) => {
    if (e.keyCode == 13) {
      this.$saveButton.click();
    } else if (e.keyCode == 27) {
      this.hide();
    }
  };

  onSaveButton = () => {
    const filename = this.getSanitizedText(this.$input[0].value);
    if (!filename || this.playlistArray.length == 0) {
      return; // shdnthpn
    }
    this.$input[0].value = '';

    // make m3u8
    const uris = [];
    for (const item of this.playlistArray) {
      const uri = item['@_uri'];
      if (!uri) {
        cl('warning no uri');
        continue;
      }
      uris.push(item['@_uri']);
    }
    const content = AppUtil.makeM3U8(uris);

    // save and hide
    $(document).trigger('disable-user-input');
    this.savePlaylist(filename, content, (isSuccess) => {
      if (isSuccess) {
        ToastView.show(`Playlist saved`);
      } else {
        ToastView.show(`<span class="colorAccent">Couldn't save playlist</span>`, 4000);
      }
      $(document).trigger('enable-user-input');
      this.hide();
    });
  };

  savePlaylist(filename, data, successCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      const isSuccess = !!data['result'];
      successCallback(isSuccess);
    };
    const onError = (e) => {
      cl('warning save playlist failed', e);
      successCallback(false);
    };
    const url = `${Values.PLAYLIST_ENDPOINT}?savePlaylist&name=${filename}`;
    $.post( { url: url, data: { data: data }, error: onError, success: onSuccess } );
  }
}
