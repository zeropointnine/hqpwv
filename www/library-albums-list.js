import LibraryContentList from './library-content-list.js';
import LibraryGroupUtil from './library-group-util.js';
import LibraryDataUtil from './library-data-util.js';
import Model from './model.js';
import Settings from './settings.js';
import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 * Model 'pipeline':
 * `filteredSortedAlbums` requires `albums` and `sortType` and `filterType`
 * `groups` requires `filteredSortedAlbums` and `groupType`
 * dom views require `groups`
 */
export default class LibraryAlbumsList extends LibraryContentList {

  filteredSortedAlbums;
  sortType;
  groupType;
  filterType;

  filteredSortedAlbumsDirty = true;
  groupsDirty = true;
  domDirty = true;

  constructor($el) {
    super($el);
    this.setSortType(Settings.librarySortType);
    this.setGroupType(Settings.libraryGroupType);
    Util.addAppListener(this, 'library-albums-sort-changed', this.onSortChanged);
    Util.addAppListener(this, 'library-albums-group-changed', this.onGroupChanged);
    Util.addAppListener(this, 'library-albums-filter-changed', this.onFilterChanged);
  }

  // override
  show() {
    if (ViewUtil.isDisplayed(this.$el)) {
      return;
    }
    ViewUtil.setDisplayed(this.$el, true);
    ViewUtil.animateCss(this.$el,
        () => this.$el.css('opacity', 0),
        () => this.$el.css('opacity', 1),
        null);
  }

  // override
  hide(now) {
    if (!ViewUtil.isDisplayed(this.$el)) {
      return;
    }
    if (now) {
      ViewUtil.setDisplayed(this.$el, false);
      return;
    }
    ViewUtil.animateCss(this.$el,
        null,
        () => this.$el.css('opacity', 0),
        () => ViewUtil.setDisplayed(this.$el, false));
  }

  // override
  clear() {
    super.clear();
    this.domDirty = true;
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

    this.labelClass = this.groupType; // nb
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
   * Updates the data and the views as needed.
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
      this.populateDom();
      this.domDirty = false;
      $(document).trigger('library-albums-list-populated');
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
  get groupClassName() {
    return 'libraryAlbumGroup';
  }

  // override
  makeListItem(data) {
    return LibraryContentList.makeAlbumListItem(data);
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
}
