import LibraryContentView from './library-content-view.js';
import LibraryGroupUtil from './library-group-util.js';
import LibraryDataUtil from './library-data-util.js';
import Model from './model.js';
import Settings from './settings.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

const groupTypetoIconClass = { 'path': 'folderIcon', 'bitrate': 'waveIcon', 'genre': 'genreIcon' };

/**
 * "Pipeline":
 *
 * `sortedAlbums` requires `albums` and `sortType`
 * `groups` requires `sortedAlbums` and `groupType`
 * dom views require `groups`
 */
export default class LibraryAlbumsView extends LibraryContentView {

  sortedAlbums;
  sortType;
  groupType;

  sortedAlbumsDirty;
  groupsDirty;
  domDirty;

  constructor($el) {
    super($el);
    this.setSortType(Settings.librarySortType);
    this.setGroupType(Settings.libraryGroupType);
    Util.addAppListener(this, 'library-albums-sort-changed', this.onSortChanged);
    Util.addAppListener(this, 'library-albums-group-changed', this.onGroupChanged);
    Util.addAppListener(this, 'library-search-view-will-populate', this.onSearchWillPopulate);
  }

  // override
  setAlbums(albums) {
    this.albums = albums;
  }

  setSortType(sortType) {
    if (this.sortType == sortType) {
      return;
    }
    this.sortType = sortType;

    this.sortedAlbumsDirty = true;
    this.groupsDirty = true;
    this.domDirty = true;
  }

  setGroupType(groupType) {
    if (this.groupType == groupType) {
      return;
    }
    this.groupType = groupType;

    this.groupsDirty = true;
    this.domDirty = true;
  }

  /**
   * Inits sorted albums, groups, and dom views as needed.
   */
  update() {
    if (this.sortedAlbumsDirty) {
      this.makeSortedAlbums();
      this.sortedAlbumsDirty = false;
    }
    if (this.groupsDirty) {
      this.makeGroups();
      this.groupsDirty = false;
    }
    if (this.domDirty) {
      this.makeDom();
      this.domDirty = false;
    }
  }

  makeSortedAlbums() {
    if (!this.albums || !this.sortType) {
      return;
    }
    this.sortedAlbums = [...this.albums];
    switch (this.sortType) {
      case 'artist':
        this.sortedAlbums.sort(LibraryDataUtil.sortByArtistThenAlbum);
        break;
      case 'album':
        this.sortedAlbums.sort(LibraryDataUtil.sortByAlbumThenArtist);
        break;
      case 'path':
        this.sortedAlbums.sort(LibraryDataUtil.sortByPath);
        break;
      case 'random':
        Util.shuffleArray(this.sortedAlbums);
        break;
      default:
        cl('warning logic error');
        break;
    }
  }

  makeGroups() {
    if (!this.sortedAlbums || !this.groupType) {
      return;
    }
    let o;
    if (this.groupType == 'path') {
      o = LibraryGroupUtil.makeDirectoryGroups(this.sortedAlbums);
    } else if (this.groupType == 'bitrate') {
      o = LibraryGroupUtil.makeBitrateGroups(this.sortedAlbums);
    } else if (this.groupType == 'genre') {
      o = LibraryGroupUtil.makeGenreGroups(this.sortedAlbums);
    } else {
      o = LibraryGroupUtil.makeIdentity(this.sortedAlbums);
    }
    this.labels = o['labels'];
    this.groups = o['groups'];
  }

  // override
  makeDom() {
    $(document).trigger('library-albums-view-will-populate');
    super.makeDom();
  }

  // override
  makeLabel(label, group) {
    const iconClass = groupTypetoIconClass[this.groupType];
    return LibraryContentView.makeLabel(label, iconClass, group.length);
  }

  // override
  makeListItem(data) {
    return LibraryContentView.makeAlbumListItem(data);
  }

  show() {
    ViewUtil.setDisplayed(this.$el, true);
    this.update();
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
  }

  onSortChanged() {
    this.setSortType(Settings.librarySortType);
    this.update();
  }

  onGroupChanged() {
    this.setGroupType(Settings.libraryGroupType);
    this.update();
  }

  onSearchWillPopulate() {
    this.clear();
    this.domDirty = true;
  }
}
