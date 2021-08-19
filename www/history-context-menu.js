import Commands from './commands.js';
import ContextMenu from './context-menu.js';
import DataUtil from './data-util.js';
import Model from './model.js';
import Service from './service.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class HistoryContextMenu extends ContextMenu {

  data;

  constructor() {
    super($("#historyContextMenu"));
  }

  show($holder, $button, historyListItemData) {
    super.show($holder, $button);
    this.data = historyListItemData;
  }

  // @Override
  onItemClick(event) {
    super.onItemClick(event);

    const $item = $(event.currentTarget);

    const id = $item.attr('id');
    let uri;
    let commands;
    switch (id) {
      case 'historyContextQueue':
        uri = DataUtil.makeUriUsingAlbumAndTrack(this.data['album'], this.data['track']);
        commands = [
          Commands.playlistAdd(uri),
          Commands.playlistGet(),
          Commands.status()
        ];
        Service.queueCommandsFront(commands);
        break;
      case 'historyContextPlayNow':
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
      case 'historyContextAlbum':
        $(document).trigger('history-context-album', this.data['album']);
        break;
    }
  }
}