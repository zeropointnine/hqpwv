import AlbumUtil from './album-util.js';
import AppUtil from './app-util.js';
import Commands from './commands.js';
import ContextMenu from './context-menu.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import Service from './service.js';
import ToastView from './toast-view.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class LoadPlaylistContextMenu extends ContextMenu {

  playlistUri;
  index;

  constructor() {
    super($('#loadPlaylistContextMenu'));
  }

  show($holder, $button, playlistUri, index) {
    super.show($holder, $button);
    this.playlistUri = playlistUri;
    this.index = index;
  }

  // override
  onItemClick(event) {
    super.onItemClick(event);
    const $item = $(event.currentTarget);
    const id = $item.attr('id');
    switch (id) {
      case 'loadPlaylistContextDelete':
        this.doDelete();
        break;
      default:
        return;
    }
  }

  doDelete() {
    const onSuccess = (data, textStatus, jqXHR) => {
      if (!!data['error']) {
        cl('warning', data['error']);
        ToastView.show(`<span class="colorAccent">Couldn't delete playlist</span>`, 4000);
      } else {
        $(document).trigger('custom-playlists-changed');
      }
    };
    const onError = (e) => {
      cl('warning', e);
      ToastView.show(`<span class="colorAccent">Couldn't delete playlist</span>`, 4000);
    };
    const name = Util.getFilenameFromPath(this.playlistUri);
    const url = `${Values.PLAYLIST_ENDPOINT}?deletePlaylist&name=${name}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }
}
