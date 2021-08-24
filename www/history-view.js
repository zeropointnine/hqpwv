import Commands from './commands.js';
import TrackListItemContextMenu from './track-list-item-context-menu.js';
import HistoryListItemUtil from './history-list-item-util.js';
import MetaUtil from './meta-util.js'
import ModalPointerUtil from './modal-pointer-util.js';
import Model from './model.js';
import PlaylistVo from './playlist-vo.js'
import Service from './service.js';
import Subview from './subview.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 * Shows history of played tracks.
 */
export default class HistoryView  extends Subview {

  listItems$;

  /** Array of list item data objects: { track, album, time } */
  items;

  constructor($el) {
  	super($el);
  	this.$list = this.$el.find("#historyList");
  	this.$el.find("#historyCloseButton").on("click tap", () => $(document).trigger('history-close-button'));
	}

  onShow() {
    this.populate();
    $(document).on('model-library-updated', this.onModelLibraryUpdated);
    $(document).on('meta-track-incremented', this.onMetaTrackIncremented);
  }

  onHide() {
    TrackListItemContextMenu.hide();
    $(document).off('model-library-updated', this.onModelLibraryUpdated);
    $(document).off('meta-track-incremented', this.onMetaTrackIncremented);
  }

  clear() {
    this.listItems$ = [];
    this.$list.empty();
  }

  populate() {
    this.clear();

    this.items = HistoryListItemUtil.makeListItemData();

    if (this.items.length == 0) {
      const $nonItem = $(`<div id="playHisNonItem">No history.</span>`);
      this.$list.append($nonItem);
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const itemPrevious = (i > 0) ? this.items[i - 1] : null;
      const itemNext = (i < this.items.length - 1) ? this.items[i + 1] : null;
      const $item = HistoryListItemUtil.makeListItem(i, item, itemPrevious, itemNext);
      $item.find(".contextButton").on("click tap", e => this.onItemContextButtonClick(e));
      this.listItems$.push($item);
      this.$list.append($item);
    }
	}

	onItemContextButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const button = event.currentTarget;
    const index = parseInt($(button).attr("data-index"));
    const data = this.items[index];
    TrackListItemContextMenu.show(this.$el, $(button), data);
	}

  onModelLibraryUpdated = () => {
    this.populate();
  };
  onMetaTrackIncremented = () => {
    this.populate();
  };
}
