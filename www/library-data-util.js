import Util from './util.js';
import HqpConfigModel from './hqp-config-model.js';
import Settings from './settings.js';

/**
 *
 */
export default class LibraryDataUtil {

  static makeFilteredAlbumsArray(albums) {
    const result = [];
    for (const album of albums) {
      if (!album['LibraryFile']) { // todo revisit
        continue;
      }
      result.push(album);
    }
    return result;
  }

  static sortByArtistThenAlbum(o1, o2) {
    let result = LibraryDataUtil.sortByArtist(o1, o2);
    if (result != 0) {
      return result;
    } else {
      return LibraryDataUtil.sortByAlbum(o1, o2);
    }
  };

  static sortByAlbumThenArtist(o1, o2) {
    let result = LibraryDataUtil.sortByAlbum(o1, o2);
    if (result != 0) {
      return result;
    } else {
      return LibraryDataUtil.sortByArtist(o1, o2);
    }
  }

  static sortByArtist(o1, o2) {
    const a = (o1['@_artist'] || '').toLowerCase();
    const b = (o2['@_artist'] || '').toLowerCase();
    return a == b ? 0 : a > b ? 1 : -1;
  };

  static sortByAlbum(o1, o2) {
    const a = (o1['@_album'] || '').toLowerCase();
    const b = (o2['@_album'] || '').toLowerCase();
    return a == b ? 0 : a > b ? 1 : -1;
  }

  static sortByPath(o1, o2) {
    const a = o1['@_path'];
    const b = o2['@_path'];
    return a == b ? 0 : a > b ? 1 : -1;
  }
}
