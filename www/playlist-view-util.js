import Util from './util.js';
import Model from './model.js';
import DataUtil from './data-util.js';
import AlbumUtil from './album-util.js';
import MetaUtil from './meta-util.js'

/**
 * Static helper functions for playlist view.
 */
export default class PlaylistViewUtil {

  static makeListItem(index, item, itemPrevious, itemNext, hasAlbum) {

    const isSameAsPrevious = (!itemPrevious && hasAlbum) || PlaylistViewUtil.areFromSameAlbum(item, itemPrevious);
    const isSameAsNext = PlaylistViewUtil.areFromSameAlbum(item, itemNext);

    let groupingClass = '';
    if (hasAlbum) {
      groupingClass = !isSameAsNext ? 'groupLast' : 'groupMiddle';
    } else {
      if (!isSameAsPrevious && isSameAsNext) {
        groupingClass = 'groupFirst';
      } else if (isSameAsPrevious && !isSameAsNext) {
        groupingClass = 'groupLast';
      } else if (isSameAsPrevious && isSameAsNext) {
        groupingClass = 'groupMiddle';
      } else { // isSameAsPrevious && isSameAsNext
        groupingClass = 'single';
      }
    }

    let s = '';
    s += `<div class="playHisItem playlistItem ${groupingClass}" data-index="${index}">`;
    s += `  <div class="left">${index+1}</div>`;
    s += `  <div class="main">${PlaylistViewUtil.makeLabel(item, hasAlbum)}</div>`;
    if (Model.library.albums.length > 0) {
      const hash = Model.library.getHashForPlaylistItem(item);
      if (hash) {
        const isFavorite = MetaUtil.isTrackFavoriteFor(hash);
        const favoriteSelectedClass = isFavorite ? 'isSelected' : '';
        const numViews = MetaUtil.getNumViewsFor(hash);
        s += `<div class="playlistItemMeta">`;
        s += `<div class="playlistItemViews">${numViews || ''}</div>`;
        s += `<div class="iconButton toggleButton favoriteButton ${favoriteSelectedClass}" data-index="${index}"></div>`;
        s += `</div>`;
      }
    }
    s += `  <div class="right"><div class="contextButton iconButton moreButton" data-index="${index}"></div></div>`;
    s += `</div>`;
    return $(s);
  }

  static makeLabel(item, hasAlbum) {
    const song = item['@_song'];
    const seconds = parseFloat(item['@_length']);

    if (hasAlbum) {
      let result = '';
      if (song) {
        result += `${song}`;
      }
      if (!result) {
        result = 'Track';
      }
      if (seconds) {
        result += ` <span class="duration">(${Util.durationText(seconds)})</span>`;
      }
      return result;
    }

    // More detailed
    const album = item['@_album'];
    const artist = item['@_artist'] || item['@_album_artist'];
    let result = '';
    if (song) {
      result += `<strong>${song}</strong>`;
    }
    if (seconds) {
      result += ` <span class="duration">(${Util.durationText(seconds)})</span>`;
    }
    if (artist) {
      result += result ? ('<br>' + artist) : artist;
    }
    if (album) {
      result += result ? ('<br>' + album) : album;
    }
    if (!result) {
      result = 'Track';
    }
    return result;
  }

  static areFromSameAlbum(track1, track2) {
    if (!track1 || !track2) {
      return false;
    }
    const uri1 = track1['@_uri'];
    const uri2 = track2['@_uri'];
    if (!uri1 || !uri2) {
      return false;
    }
    const base1 = Util.stripFilenameFromPath(uri1);
    const base2 = Util.stripFilenameFromPath(uri2);
    return (base1 === base2);
  }

  static makeAlbumHeader(album, item, itemPrevious) {
    if (!album) {
      return null;
    }
    const isSameAsPrevious = PlaylistViewUtil.areFromSameAlbum(item, itemPrevious);
    if (isSameAsPrevious) {
      return null;
    }
    const imgPath = DataUtil.getAlbumImageUrl(album);
    const albumText = album['@_album'];
    const artistText = album['@_artist'];
    if (!albumText && !artistText) {
      return null;
    }

    let text = '';
    if (artistText) {
      text += artistText;
    }
    if (albumText) {
      text += text ? ('<br>' + albumText) : albumText;
    }
    if (!text) {
      return null;
    }

    const statsText = AlbumUtil.makePlaylistAlbumStatsText(album);

    let s = '';
    s +=  `<div class="playHisItem playlistItem groupFirst playlistAlbumLine">`;
    s +=    `<div class="playlistAlbumButton" data-hash="${album['@_hash']}">`;
    s +=      `<img src="${imgPath}">`;
    s +=      `<div class="text">${text}</div>`;
    s +=    `</div>`;
    s +=    `<div class="statsText">${statsText}</div>`;
    s += `</div>`;
    return $(s);
  }

  static onItemFavoriteButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const $button = $(event.currentTarget);
    const index = parseInt($button.attr("data-index"));
    const item = Model.playlist.array[index];
    const hash = Model.library.getHashForPlaylistItem(item);
    if (!hash) {
      cl('warning no hash for ', item['@_uri']);
      return;
    }
    const oldValue = MetaUtil.isTrackFavoriteFor(hash);
    const newValue = !oldValue;
    // update button
    if (newValue) {
      $button.addClass('isSelected');
    } else {
      $button.removeClass('isSelected');
    }
    // update model
    MetaUtil.setTrackFavoriteFor(hash, newValue);
  }

}
