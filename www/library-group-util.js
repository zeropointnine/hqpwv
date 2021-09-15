import HqpConfigModel from './hqp-config-model.js';
import LibraryDataUtil from './library-data-util.js';
import ModalPointerUtil from './modal-pointer-util.js';
import Settings from './settings.js';
import ViewUtil from './view-util.js';

/**
 * Util fns for making 'library groups'
 *
 * Rem, the `albums` param used by these fns can
 * have had different sort orders applied to them.
 */
class LibraryGroupUtil {

  /**
   * Find the "directory level" at which albums no longer share the base directory paths.
   */
  findBaseDirectoryLevel(albums) {
    if (albums.length == 0) {
      return 0;
    }

    const pathArrays = [];
    for (const album of albums) {
      const path = album['@_path'];
      const a = this.makePathArray(path);
      pathArrays.push(a);
    }

    let level = 0;
    
    while (true) {

      let lastSubdir;
      for (let i = 0; i < pathArrays.length; i++) {

        const pathArray = pathArrays[i];

        if (level >= pathArray.length - 1) {
          return level;
        }

        const subdir = pathArray[level];

        if (i == 0) {
          lastSubdir = subdir;
          continue;
        }

        if (subdir !== lastSubdir) {
          return level;
        }
      }
      level++;
    }
  }

  makeDirectoryGroups(albums) {
    const dirLevel = this.findBaseDirectoryLevel(albums);

    const o = {}; // special intermediate object
    for (const album of albums) {
      const path = album['@_path'];
      const pathArray = this.makePathArray(path);
      const subdir = pathArray[dirLevel];
      if (!o[subdir]) {
        o[subdir] = []
      }
      o[subdir].push(album);
    }

    const a = Object.keys(o);
    a.sort();

    const labels = [];
    const groups = [];
    for (const key of a) {
      labels.push(key);
      groups.push(o[key]);
    }

    return { labels:labels, groups: groups };
  }

  makeArtistGroups(albums, searchString=null) {

    // key = artist, value = array of albums
    const artistArrays = {};
    const noArtists = []; // shouldn't be possible?
    for (const album of albums) {
      const artist = album['@_artist'];
      if (artist) {
        if (!artistArrays[artist]) {
          artistArrays[artist] = [];
        }
        artistArrays[artist].push(album);
      } else {
        noArtists.push(album);
      }
    }

    const artistKeys = Object.keys(artistArrays);
    artistKeys.sort();
    const labels = [];
    const groups = [];
    for (const artistKey of artistKeys) {
      const b = (!searchString || artistKey.includes(searchString));
      if (b) {
        labels.push(artistKey);
        groups.push(artistArrays[artistKey]);
      }
    }
    if (!searchString && noArtists.length > 0) {
      labels.push('No Artist');
      groups.push(noArtists);
    }

    return { labels: labels, groups: groups };
  }

  /**
   *
   */
  makeGenreGroups(albums, searchString=null) {

    // key = genre, value = array of albums
    const genreArrays = {};
    const noGenreAlbums = [];
    for (const album of albums) {
      const genres = album['genres'];
      if (genres.length > 0) {
        for (const genre of genres) {
          if (!genreArrays[genre]) {
            genreArrays[genre] = [];
          }
          genreArrays[genre].push(album);
        }
      } else {
        noGenreAlbums.push(album);
      }
    }

    const genreKeys = Object.keys(genreArrays);
    genreKeys.sort();
    const labels = [];
    const groups = [];
    for (const genreKey of genreKeys) {
      const b = (!searchString || genreKey.includes(searchString));
      if (b) {
        labels.push(genreKey);
        groups.push(genreArrays[genreKey]);
      }
    }
    if (!searchString && noGenreAlbums.length > 0) {
      labels.push('No genre');
      groups.push(noGenreAlbums);
    }

    return { labels: labels, groups: groups };
  }

  makeBitrateGroups(albums) {
    // Taking hardcoded approach...
    const fs1 = [];
    const fs2 = [];
    const fs3 = [];
    const fs4 = [];
    const fs5Plus = [];
    const dsd = [];
    const unknown = [];

    for (const album of albums) {
      let bucket = null;
      const bits = parseInt(album['@_bits']);
      if (bits == 1) {
        bucket = dsd;
      } else {
        const rate = parseInt(album['@_rate']);
        if (isNaN(rate) || rate == 0) {
          bucket = unknown;
        } else if (rate <= HqpConfigModel.PCM_MULTIPLE_B * 1) {
          bucket = fs1;
        } else if (rate <= HqpConfigModel.PCM_MULTIPLE_B * 2) {
          bucket = fs2;
        } else if (rate <= HqpConfigModel.PCM_MULTIPLE_B * 3) {
          bucket = fs3;
        } else if (rate <= HqpConfigModel.PCM_MULTIPLE_B * 4) {
          bucket = fs4;
        } else {
          bucket = fs5Plus;
        }
      }
      bucket.push(album);
    }

    const groups = [];
    const labels = [];
    if (fs5Plus.length > 0) {
      groups.push(fs5Plus);
      labels.push(`PCM 705/768K+`);
    }
    if (fs4.length > 0) {
      groups.push(fs4);
      labels.push(`PCM 352/384K`);
    }
    if (fs3.length > 0) {
      groups.push(fs3);
      labels.push(`PCM 176/192K`);
    }
    if (fs2.length > 0) {
      groups.push(fs2);
      labels.push(`PCM 88/96K`);
    }
    if (fs1.length > 0) {
      groups.push(fs1);
      labels.push(`PCM 44/48K`);
    }
    if (dsd.length > 0) {
      groups.push(dsd);
      labels.push(`DSD`);
    }
    if (unknown.length > 0) {
      groups.push(unknown);
      labels.push(`Unknown`);
    }
    return { labels: labels, groups: groups };
  }

  /**
   * Returns 'identity' group object.
   */
  makeIdentity(albums) {
    const groups = [];
    const group = [...albums];
    groups.push(group);
    const labels = [];
    labels.push('');
    return { labels: labels, groups: groups };
  }

  makePathArray(path) {
    // just in case
    path = path.replace('//', '/');
    // just in case
    path = path.replace('file:', '');
    // remove first slash
    if (path.indexOf('/') == 0) {
      path = path.substr(1);
    }
    const result = path.split('/');
    return result;
  }
}

export default new LibraryGroupUtil()
