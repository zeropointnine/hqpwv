import ViewUtil from './view-util.js';
import Settings from './settings.js';
import ModalPointerUtil from './modal-pointer-util.js';

/**
 *
 */
class LibraryGroupUtil {

  makeGroups(albums) {
    if (Settings.librarySortType == 'path') {
      return this.makeDirectoryGroups(albums);
    }
    return this.makeIdentityGroups(albums);
  }

  /**
   * Returns 'identity' [group].
   */
  makeIdentityGroups(albums) {
    const groups = [];
    const labels = [];

    const group = [];
    for (const album of albums) {
      if (true) {
        group.push(album);
      }
    }
    groups.push(group);
    labels.push('');

    return { groups: groups, labels: labels };
  }

  /**
   * Assumption is that array is already sorted by album path.
   */
  makeDirectoryGroups(albums) {
    const dirLevel = this.findSharedDirectoryLevel(albums);

    const groups = [];
    const labels = [];

    let group;

    let lastSubdir = null;
    for (const album of albums) {
      const subdir = album['pathArray'][dirLevel];
      if (subdir != lastSubdir) {
        group = [];
        groups.push(group);
        const label = `<span class="icon folderIcon"></span><span class="inner">${subdir}/</span>`;
        labels.push(label);
      }

      group.push(album);

      lastSubdir = subdir;
    }
    return { groups: groups, labels: labels };
  }

  /**
   * Find the "directory level" at which elements no longer share the same ancestor directory/ies.
   */
  findSharedDirectoryLevel(albums) {

    // If path is '/a/b/c', dirLevel=1 means 'b'
    let dirLevel = 0;

    // Hash of unique directory names for all albums at a given path level (where value is the count).
    // Don't rly need this info for main 'generator' loop, but that's ok, for now.
    let directoryNames;

    while (true) {

      directoryNames = {};

      for (const album of albums) {

        const path = album['@_path'];
        const pathArray = this.makePathArray(path);
        album['pathArray'] = pathArray; // save for later
        const dir = pathArray[dirLevel];
        if (!directoryNames[dir]) {
          directoryNames[dir] = 0;
        }
        directoryNames[dir]++;
      }

      // List of unique directory names at the given directory level
      const keysArray = Object.keys(directoryNames);
      if (keysArray.length > 1) {
        break;
      } else {
        dirLevel++;
      }
    }

    // cl('result', dirLevel, directoryNames);
    return dirLevel;
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
