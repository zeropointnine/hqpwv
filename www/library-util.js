import Util from './util.js';
import HqpConfigModel from './hqp-config-model.js';
import Settings from './settings.js';

/**
 *
 */
class LibraryUtil {

  /**
   * Creates and returns filtered, shallow copy of albums array.
   * Uses Settings info.
   */
  makeFilteredAlbumsArray(albums) {
    const result = [];

    if (Settings.libraryBitratesArray.includes('all')) {
      for (const album of albums) {
        if (!album['LibraryFile']) {
          continue;
        }
        result.push(album);
      }
      return result;
    }

    const mult = HqpConfigModel.PCM_MULTIPLE_B;
    const rangeMap = {
      'pcm1fs'      : [0,            mult * 1],
      'pcm2fs'      : [mult * 1 + 1, mult * 2],
      'pcm4fs'      : [mult * 2 + 1, mult * 4],
      'pcm8fs'      : [mult * 4 + 1, mult * 8],
      'pcm16fs_plus': [mult * 8 + 1, 2822400 - 1], // errm
      'dsd_all'     : [2822400,      99999999]
    };

    // ranges is an array of 2-element arrays
    // where element1 is lowerbound and element2 is upperbound, inclusive
    const ranges = [];
    for (const item of Settings.libraryBitratesArray) {
      const range = rangeMap[item];
      if (!range) {
        cl('warning data or logic error', item);
        continue;
      }
      ranges.push(range);
    }

    for (const album of albums) {
      if (!album['LibraryFile']) {
        continue;
      }

      let rate = parseInt(album['@_rate']);
      let alwaysAdd = false;
      if (!rate) {
        cl('warning bad rate value', rate, album);
        alwaysAdd = true; // todo verify behavior of mixed bitrate albums
      }
      if (alwaysAdd) {
        result.push(album);
      } else {
        for (const range of ranges) {
          if (rate >= range[0] && rate <= range[1]) {
            result.push(album);
            break;
          }
        }
      }
    }

    return result;
  }

  /**
   * Sorts albums array 'in-place'.
   */
  sortAlbums(albums, sortType) {

    const sortByArtist = (o1, o2) => {
      const a = (o1['@_artist'] || '').toLowerCase();
      const b = (o2['@_artist'] || '').toLowerCase();
      return a == b ? 0 : a > b ? 1 : -1;
    };

    const sortByAlbum = (o1, o2) => {
      const a = (o1['@_album'] || '').toLowerCase();
      const b = (o2['@_album'] || '').toLowerCase();
      return a == b ? 0 : a > b ? 1 : -1;
    };

    const sortByPath = (o1, o2) => {
      const a = o1['@_path'];
      const b = o2['@_path'];
      return a == b ? 0 : a > b ? 1 : -1;
    };

    const sortByArtistThenAlbum = (o1, o2) => {
      let result = sortByArtist(o1, o2);
      if (result != 0) {
        return result;
      } else {
        return sortByAlbum(o1, o2);
      }
    };

    const sortByAlbumThenArtist = (o1, o2) => {
      let result = sortByAlbum(o1, o2);
      if (result != 0) {
        return result;
      } else {
        return sortByArtist(o1, o2);
      }
    };

    switch (sortType) {
      case 'album':
        albums.sort(sortByAlbumThenArtist);
        break;
      case 'path':
        albums.sort(sortByPath);
        break;
      case 'random':
        Util.shuffleArray(albums);
        break;
      case 'artist':
      default:
        albums.sort(sortByArtistThenAlbum);
        break;
    }
  }
}

export default new LibraryUtil();