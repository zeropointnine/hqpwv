import LibraryContentView from './library-content-view.js';
import LibraryGroupUtil from './library-group-util.js';
import LibraryDataUtil from './library-data-util.js';
import Model from './model.js';
import Settings from './settings.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

const groupTypetoIconClass = { 'path': 'folderIcon', 'bitrate': 'waveIcon', 'genre': 'genreIcon' };

/**
 * Model 'pipeline':
 * `filteredSortedAlbums` requires `albums` and `sortType` and `filterType`
 * `groups` requires `filteredSortedAlbums` and `groupType`
 * dom views require `groups`
 */
export default class LibraryAlbumsView extends LibraryContentView {

  filteredSortedAlbums;
  sortType;
  groupType;
  filterType;

  filteredSortedAlbumsDirty;
  groupsDirty;
  domDirty;

  constructor($el) {
    super($el);
    this.setSortType(Settings.librarySortType);
    this.setGroupType(Settings.libraryGroupType);
    Util.addAppListener(this, 'library-albums-sort-changed', this.onSortChanged);
    Util.addAppListener(this, 'library-albums-group-changed', this.onGroupChanged);
    Util.addAppListener(this, 'library-albums-filter-changed', this.onFilterChanged);
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

    this.filteredSortedAlbumsDirty = true;
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

  setFilterType(filterType) {
    if (this.filterType == filterType) {
      return;
    }
    this.filterType = filterType;

    this.filteredSortedAlbumsDirty = true;
    this.groupsDirty = true;
    this.domDirty = true;
  }

  /**
   * Inits sorted albums, groups, and dom views as needed.
   */
  update() {
    if (this.filteredSortedAlbumsDirty) {
      this.makeFilteredSortedAlbums();
      this.filteredSortedAlbumsDirty = false;
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

  makeFilteredSortedAlbums() {
    if (!this.albums || !this.sortType) {
      return;
    }

    const a = LibraryDataUtil.makeFilteredAlbumsArray(this.albums, Settings.libraryFilterType);

    switch (this.sortType) {
      case 'artist':
        a.sort(LibraryDataUtil.sortByArtistThenAlbum);
        break;
      case 'album':
        a.sort(LibraryDataUtil.sortByAlbumThenArtist);
        break;
      case 'path':
        a.sort(LibraryDataUtil.sortByPath);
        break;
      case 'random':
        Util.shuffleArray(a);
        break;
      default:
        cl('warning logic error');
        break;
    }
    this.filteredSortedAlbums = a;
  }

  makeGroups() {
    if (!this.filteredSortedAlbums || !this.groupType) {
      return;
    }
    let o;
    if (this.groupType == 'path') {
      o = LibraryGroupUtil.makeDirectoryGroups(this.filteredSortedAlbums);
    } else if (this.groupType == 'bitrate') {
      o = LibraryGroupUtil.makeBitrateGroups(this.filteredSortedAlbums);
    } else if (this.groupType == 'genre') {
      o = LibraryGroupUtil.makeGenreGroups(this.filteredSortedAlbums);
    } else {
      o = LibraryGroupUtil.makeIdentity(this.filteredSortedAlbums);
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

  onFilterChanged() {
    this.setFilterType(Settings.libraryFilterType);
    this.update();
  }

  onSearchWillPopulate() {
    this.clear();
    this.domDirty = true;
  }
}
