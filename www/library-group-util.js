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
   * Assumption is that array is already sorted by album path.
   */
  makeDirectoryGroups(albums) {
    const dirLevel = this.findBaseDirectoryLevel(albums);

    const groups = [];
    const labels = [];

    let group;
    let lastSubdir = null;

    for (const album of albums) {
      const path = album['@_path'];
      const pathArray = this.makePathArray(path);
      const subdir = pathArray[dirLevel];
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
   * Returns 'identity' group object.
   */
  makeIdentityGroups(albums) {
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
