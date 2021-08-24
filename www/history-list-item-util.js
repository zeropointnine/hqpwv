import MetaUtil from './meta-util.js';
import Model from './model.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

const UNKNOWN_HTML_TEXT = `<em class="colorTextLess">Unknown track</em>`;

/**
 * 
 */
export default class HistoryListItemUtil {

  static makeListItemData() {
    // Meta history item has a hash and a timestamp.
    // We get the matching library track and its containing album when exists,
    // and the history timestamp into an object.
    const items = [];
    for (let i = MetaUtil.history.length -1; i >= 0; i--) {
      const historyItem = MetaUtil.history[i];
      const hash = historyItem['hash'];
      const time = historyItem['time'] || 0;
      const trackAndAlbum = Model.library.getTrackAndAlbumByHash(hash);
      const track = trackAndAlbum ? trackAndAlbum[0] : null;
      const album = trackAndAlbum ? trackAndAlbum[1] : null;
      let item = { track: track, album: album, time: time };
      items.push(item);
    }
    return items;
  }

	static makeListItem(index, item, itemPrevious, itemNext) {

    let groupingClass = '';
    const isSameAsPrevious = HistoryListItemUtil.areFromSameAlbum(item, itemPrevious);
    const isSameAsNext = HistoryListItemUtil.areFromSameAlbum(item, itemNext);
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
    if (!time) {
      agoString = '';
    } else {
      const ms = new Date().getTime() - time;
      agoString = Util.makeHowLongAgoString(ms);
    }

    const contextDisabledClass = (!item['track'] || !item['album']) ? 'isDisabled' : '';

		let s = '';
		s += `<div class="playHisItem historyItem ${groupingClass}">`;
		s += `  <div class="left">${index+1}</div>`;
		s += `  <div class="main">${HistoryListItemUtil.makeListItemText(item)}</div>`;
    s += `  <div class="historyItemAgo">${agoString}</div>`;
		s += `  <div class="right"><div class="contextButton iconButton moreButton ${contextDisabledClass}" data-index="${index}"></div></div>`;
		s += `</div>`;
		return $(s);
	}

  static areFromSameAlbum(item1, item2) {
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

	static makeListItemText(item) {
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
}
