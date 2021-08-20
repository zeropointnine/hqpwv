import HqpConfigModel from './hqp-config-model.js';
import LibraryUtil from './library-util.js';
import ModalPointerUtil from './modal-pointer-util.js';
import Settings from './settings.js';
import ViewUtil from './view-util.js';

/**
 *
 */
class LibraryGroupUtil {

  makeGroups(albums, groupType) {
    if (groupType == 'path') {
      return this.makeDirectoryGroups(albums);
    }
    if (groupType == 'bitrate') {
      return this.makeBitrateGroups(albums);
    }
    if (groupType == 'genre') {
      return this.makeGenreGroups(albums);
    }
    return this.makeIdentity(albums);
  }

  /** Sorts the elements within each individual group. */
  sortAlbumsWithinGroups(groups) {
    for (const group of groups) {
      LibraryUtil.sortAlbums(group, Settings.librarySortType);
    }
  }

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

  /**
   *
   */
  makeDirectoryGroups(albums) {
    const dirLevel = this.findBaseDirectoryLevel(albums);

    const groups = [];
    const labels = [];

    let group;
    let lastSubdir = null;

    // Make shallow copy and sort by path
    albums = [...albums];
    LibraryUtil.sortAlbums(albums, 'path');

    for (const album of albums) {
      const path = album['@_path'];
      const pathArray = this.makePathArray(path);
      const subdir = pathArray[dirLevel];
      if (subdir != lastSubdir) {
        group = [];
        groups.push(group);
        const label = subdir + '/';
        labels.push(label);
      }

      group.push(album);
      lastSubdir = subdir;
    }
    return { groups: groups, labels: labels };
  }

  /**
   *
   */
  makeGenreGroups(albums) {
    const genres = {};
    const noGenreAlbums = [];
    for (const album of albums) {
      let genre = album['@_genre'];
      if (!genre) {
        noGenreAlbums.push(genre);
      } else {
        genre = genre.toLowerCase();
        genre = genre.substr(0, 100);
        if (!genres[genre]) {
          genres[genre] = [];
        }
        genres[genre].push(album);
      }
    }

    const genreKeys = Object.keys(genres);
    genreKeys.sort();

    const groups = [];
    const labels = [];
    for (const genreKey of genreKeys) {
      groups.push(genres[genreKey]);
      labels.push(genreKey);
    }
    return { groups: groups, labels: labels };
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
    return { groups: groups, labels: labels };
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
    return { groups: groups, labels: labels };
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
