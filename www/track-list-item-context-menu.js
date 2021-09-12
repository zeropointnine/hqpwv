import Commands from './commands.js';
import ContextMenu from './context-menu.js';
import DataUtil from './data-util.js';
import Model from './model.js';
import Service from './service.js';
import ViewUtil from './view-util.js';

/**
 * Used by search/track and history list items.
 */
class TrackListItemContextMenu extends ContextMenu {

  data;

  constructor() {
    super($("#trackListItemContextMenu"));
  }

  show($holder, $button, data) {
    super.show($holder, $button);
    this.data = data;
  }

  // override
  onItemClick(event) {
    super.onItemClick(event);

    const $item = $(event.currentTarget);

    // `data` is either { track, album } object, or just track object (not pretty)
    const track = this.data['track'] || this.data;
    let album;
    if (this.data['album']) {
      album = this.data['album'];
    } else {
      album = Model.library.getAlbumByTrackHash(track['@_hash']);
    }
    if (!album) {
      cl('warning check logic');
      return;
    }

    const id = $item.attr('id');
    let uri;
    let commands;
    switch (id) {
      case 'trackListItemContextQueue':
        uri = DataUtil.makeUriUsingAlbumAndTrack(album, track);
        commands = [
          Commands.playlistAdd(uri),
          Commands.playlistGet(),
          Commands.status()
        ];
        Service.queueCommandsFront(commands);
        break;
      case 'trackListItemContextPlayNow':
        uri = DataUtil.makeUriUsingAlbumAndTrack(album, track);
        commands = [
          Commands.stop(),
          Commands.playlistClear(),
          Commands.playlistAdd(uri),
          Commands.playlistGet(),
          Commands.play(),
          Commands.status()
        ];
        Service.queueCommandsFront(commands);
        break;
    }
  }
}

export default new TrackListItemContextMenu();