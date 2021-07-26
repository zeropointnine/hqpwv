import ContextMenu from './context-menu.js';
import ViewUtil from './view-util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';

/**
 *
 */
export default class AlbumContextMenu extends ContextMenu{

  album;
  index = -1;

  constructor($el) {
    super($el);

    this.$itemQueue = this.$el.find('#albumContextItemQueue');
    this.$itemQueueMultiple = this.$el.find('#albumContextItemQueueMultiple');
    this.$itemPlayNow = this.$el.find('#albumContextItemPlayNow');
    this.$itemPlayNowMultiple = this.$el.find('#albumContextItemPlayNowMultiple');
  }

  show($holder, $button, album, index) {
    super.show($holder, $button);

    this.album = album;
    this.index = index;

    // Update items' vis
    const lastTrackEndIndex = Model.getTracksOf(this.album).length - 1;
    const isLastItem = (this.index == lastTrackEndIndex);
    ViewUtil.setDisplayed(this.$itemQueueMultiple, !isLastItem);
    ViewUtil.setDisplayed(this.$itemPlayNowMultiple, !isLastItem);
  }

  onItemClick(event) {
    super.onItemClick(event);
    const $item = $(event.currentTarget);

    const id = $item.attr('id');
    const lastTrackEndIndex = Model.getTracksOf(this.album).length - 1;
    let isPlayNow;
    const startIndex = this.index;
    let endIndex;
    switch (id) {
      case 'albumContextItemQueue':
        endIndex = startIndex;
        isPlayNow = false;
        break;
      case 'albumContextItemQueueMultiple':
        endIndex = lastTrackEndIndex;
        isPlayNow = false;
        break;
      case 'albumContextItemPlayNow':
        endIndex = startIndex;
        isPlayNow = true;
        break;
      case 'albumContextItemPlayNowMultiple':
        endIndex = lastTrackEndIndex;
        isPlayNow = true;
        break;
      default:
        return;
    }
    const commands = Commands.addTrackUsingAlbumAndIndices(this.album, startIndex, endIndex, isPlayNow);
    Service.queueCommandsFront(commands);
  }
}
