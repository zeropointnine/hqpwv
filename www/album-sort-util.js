import Util from './util.js';

/**
 *
 */
class AlbumSortUtil {

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

export default new AlbumSortUtil();