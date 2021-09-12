import Commands from './commands.js';
import MetaUtil from './meta-util.js'
import ModalPointerUtil from './modal-pointer-util.js';
import Model from './model.js';
import PlaylistVo from './playlist-vo.js'
import Service from './service.js';
import Subview from './subview.js';
import TrackListItemContextMenu from './track-list-item-context-menu.js';
import TrackListItemUtil from './track-list-item-util.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 * Shows history of played tracks.
 */
export default class HistoryView  extends Subview {

  $count;
  trackMetaChangeHandler;
  tracks;

  constructor($el) {
  	super($el);
  	this.$list = this.$el.find('#historyList');
    this.$count = this.$el.find('#historyCount');
  	this.$el.find('#historyCloseButton').on("click tap", () => $(document).trigger('history-close-button'));
    this.trackMetaChangeHandler = TrackListItemUtil.makeTrackMetaChangeHandler(this.$list);
	}

  onShow() {
    this.populate();
    $(document).on('model-library-updated', this.onModelLibraryUpdated);
    $(document).on('meta-track-favorite-changed meta-track-incremented', this.trackMetaChangeHandler);
  }

  onHide() {
    TrackListItemContextMenu.hide();
    $(document).off('model-library-updated', this.onModelLibraryUpdated);
    $(document).off('meta-track-favorite-changed meta-track-incremented', this.trackMetaChangeHandler);
  }

  clear() {
    this.$list.empty();
  }

  populate() {
    this.clear();

    // parallel arrays (not great)
    const tracks = [];
    const agoStrings = [];

    for (let i = MetaUtil.history.length - 1; i >= 0; i--) { // revchron

      const item = MetaUtil.history[i];
      const track = Model.library.getTrackByHash(item['hash']) || {};
      tracks.push(track);

      const time = item['time'];
      if (!time) {
        agoStrings.push(''); // shdnthpn
      } else {
        const ms = new Date().getTime() - time;
        agoStrings.push(Util.makeHowLongAgoString(ms));
      }

      if (tracks.length >= 500) {
        break;
      }
    }

    this.tracks = tracks;

    this.$count.text(tracks.length > 0 ? `(${tracks.length} tracks)` : ``);

    if (tracks.length == 0) {
      const $nonItem = $(`<div id="playHisNonItem">No history</span>`);
      this.$list.append($nonItem);
      return;
    }

    TrackListItemUtil.populateHistoryList(this.$list, tracks, agoStrings);
    const $contextButtons = this.$list.find(".contextButton");
    $contextButtons.on("click tap", this.onContextButton);
	}

	onContextButton = (event) => {
    event.stopPropagation();
    const $button = $(event.currentTarget);
    const $listItem = $button.parent().parent();
    const index = parseInt($listItem.attr('data-index'));
    if (!(index >= 0)) {
      cl('warning no index');
      return;
    }
    const data = this.tracks[index];
    TrackListItemContextMenu.show(this.$el, $button, data);
	}

  onModelLibraryUpdated = () => {
    this.populate();
  };
}
