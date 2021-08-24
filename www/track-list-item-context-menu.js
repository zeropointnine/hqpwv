import Commands from './commands.js';
import ContextMenu from './context-menu.js';
import DataUtil from './data-util.js';
import Model from './model.js';
import Service from './service.js';
import ViewUtil from './view-util.js';

/**
 *
 */
class TrackListItemContextMenu extends ContextMenu {

  data;

  hello = Math.random();

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

    const id = $item.attr('id');
    let uri;
    let commands;
    switch (id) {
      case 'trackListItemContextQueue':
        uri = DataUtil.makeUriUsingAlbumAndTrack(this.data['album'], this.data['track']);
        commands = [
          Commands.playlistAdd(uri),
          Commands.playlistGet(),
          Commands.status()
        ];
        Service.queueCommandsFront(commands);
        break;
      case 'trackListItemContextPlayNow':
        uri = DataUtil.makeUriUsingAlbumAndTrack(this.data['album'], this.data['track']);
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
      case 'trackListItemContextAlbum':
        $(document).trigger('history-context-album', this.data['album']);
        break;
    }
  }
}

export default new TrackListItemContextMenu(); // NB! singleton-like