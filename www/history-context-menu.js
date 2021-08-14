import ContextMenu from './context-menu.js';
import ViewUtil from './view-util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';

/**
 *
 */
export default class HistoryContextMenu extends ContextMenu {

  $queueItem;
  $playNowItem;
  $albumItem;

  data;

  constructor() {
    super($("#historyContextMenu"));

    this.$queueItem = this.$el.find("#historyContextUp");
    this.$playNowItem = this.$el.find("#historyContextDown");
    this.$albumItem = this.$el.find("#historyContextAlbum");

    this.$queueItem.on("click tap", e => {
      // todo
    });

    this.$playNowItem.on("click tap", e => {
      // todo
    });

    this.$albumItem.on("click tap", e => {
      $(document).trigger('history-context-album', this.data['album']);
    });
  }

  show($holder, $button, historyListItemData) {
    super.show($holder, $button);
    this.data = historyListItemData;
  }
}
