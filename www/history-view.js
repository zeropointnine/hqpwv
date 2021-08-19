import Subview from './subview.js';
import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Commands from './commands.js';
import Service from './service.js';
import ModalPointerUtil from './modal-pointer-util.js';
import MetaUtil from './meta-util.js'
import PlaylistVo from './playlist-vo.js'
import HistoryContextMenu from './history-context-menu.js';

const UNKNOWN_HTML_TEXT = `<em class="colorTextLess">Unknown track</em>`;

/**
 * Shows history of played tracks.
 * Based off of PlaylistView.
 */
export default class HistoryView  extends Subview {

  listItems$;
  contextMenu;

  /** Array of list item data objects: { track, album, time } */
  items;

  constructor($el) {
  	super($el);
  	this.$list = this.$el.find("#historyList");
    this.contextMenu = new HistoryContextMenu();
  	this.$el.find("#historyCloseButton").on("click tap", () => $(document).trigger('history-close-button'));
	}

  onShow() {
    this.populate();
    $(document).on('model-library-updated', this.onModelLibraryUpdated);
    $(document).on('meta-track-incremented', this.onMetaTrackIncremented);
  }

  onHide() {
    this.contextMenu.hide();
    $(document).off('model-library-updated', this.onModelLibraryUpdated);
    $(document).off('meta-track-incremented', this.onMetaTrackIncremented);
  }

  populate() {
    // Make list item data array:
    // Meta history item has a hash and a timestamp.
    // We get the matching library track and its containing album when exists,
    // and the history timestamp into an object.
    this.items = [];
    for (let i = MetaUtil.history.length -1; i >= 0; i--) {
      const historyItem = MetaUtil.history[i];
      const hash = historyItem['hash'];
      const time = historyItem['time'] || 0;
      const trackAndAlbum = Model.library.getTrackAndAlbumByHash(hash);
      const track = trackAndAlbum ? trackAndAlbum[0] : null;
      const album = trackAndAlbum ? trackAndAlbum[1] : null;
      let item = { track: track, album: album, time: time };
      this.items.push(item);
    }

    // Populate list items
    this.listItems$ = [];
		this.$list.empty();

    if (this.items.length == 0) {
      const $nonItem = $(`<div id="playHisNonItem">No history.</span>`);
      this.$list.append($nonItem);
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const itemPrevious = (i > 0) ? this.items[i - 1] : null;
      const itemNext = (i < this.items.length - 1) ? this.items[i + 1] : null;
      const $item = this.makeListItem(i, item, itemPrevious, itemNext);
      $item.find(".contextButton").on("click tap", e => this.onItemContextButtonClick(e));
      this.listItems$.push($item);
      this.$list.append($item);
    }
	}

	makeListItem(index, item, itemPrevious, itemNext) {

    let groupingClass = '';
    const isSameAsPrevious = this.areFromSameAlbum(item, itemPrevious);
    const isSameAsNext = this.areFromSameAlbum(item, itemNext);
    if (!isSameAsPrevious && isSameAsNext) {
      groupingClass = 'groupFirst';
    } else if (isSameAsPrevious && !isSameAsNext) {
      groupingClass = 'groupLast';
    } else if (isSameAsPrevious && isSameAsNext) {
      groupingClass = 'groupMiddle';
    } else { // isSameAsPrevious && isSameAsNext
      groupingClass = 'single';
    }

    let agoString;
    const time = item['time'];
    if (time == 0) {
      agoString = ''; // shouldn't happen
    } else {
      const ms = new Date().getTime() - time;
      agoString = Util.makeHowLongAgoString(ms);
    }

    const contextDisabledClass = (!item['track'] || !item['album']) ? 'isDisabled' : '';

		let s = '';
		s += `<div class="playHisItem historyItem ${groupingClass}">`;
		s += `  <div class="left">${index+1}</div>`;
		s += `  <div class="main">${this.makeLabel(item)}</div>`;
    s += `  <div class="historyItemAgo">${agoString}</div>`;
		s += `  <div class="right"><div class="contextButton iconButton moreButton ${contextDisabledClass}" data-index="${index}"></div></div>`;
		s += `</div>`;
		return $(s);
	}

  areFromSameAlbum(item1, item2) {
    if (!item1 || !item2) {
      return false;
    }
    const album1 = item1['album'];
    const album2 = item2['album'];
    if (!album1 || !album2) {
      if (!album1 && !album2) {
        return true; // haw
      }
      return false;
    }
    return (album1 == album2);
  }

	makeLabel(item) {
    const track = item['track'];
    const album = item['album'];
    if (!track || !album) {
      return UNKNOWN_HTML_TEXT;
    }

    const artistText = album['@_artist'] || track['@_artist'] || '';
		const albumText = album['@_album'] || '';
    const songText = track['@_song'] || track['@_name'] || '';

		let result = '';
		if (songText) {
			result += `<strong>${songText}</strong>`;
		}
		if (artistText) {
			result += result ? ('<br>' + artistText) : artistText;
		}
		if (albumText) {
			result += result ? ('<br>' + albumText) : albumText;
		}
		if (!result) {
			result = UNKNOWN_HTML_TEXT;
		}
		return result;
	}

	onItemContextButtonClick(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const index = parseInt($(button).attr("data-index"));
    const item = this.items[index];
    this.contextMenu.show(this.$el, $(button), item);
	}

  onModelLibraryUpdated = () => {
    this.populate();
  };
  onMetaTrackIncremented = () => {
    this.populate();
  };
}
