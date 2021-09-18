import AlbumUtil from './album-util.js';
import LibraryContentList from './library-content-list.js';
import LibraryDataUtil from './library-data-util.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import Settings from './settings.js';
import LibraryGroupUtil from './library-group-util.js';
import TrackListItemContextMenu from './track-list-item-context-menu.js';
import TrackListItemUtil from './track-list-item-util.js';
import ViewUtil from './view-util.js';
import Util from './util.js';

/**
 * One of the two main library 'content views'.
 * Shows search results using artist name, album name, or tracks name (mutually exclusive).
 * Track results use own list item type (similar to history view).
 */
export default class LibrarySearchList extends LibraryContentList {

  searchType;
  searchValue;
  trackMetaChangeHandler;

  constructor($el) {
    super($el);
    ViewUtil.setDisplayed(this.$el, false);

    this.trackMetaChangeHandler = TrackListItemUtil.makeTrackMetaChangeHandler(this.$el);
    $(document).on('meta-track-favorite-changed meta-track-incremented', this.trackMetaChangeHandler);

    this.sortType = 'default';
  }

  // override
  show(now) {
    ViewUtil.setDisplayed(this.$el, true);
    if (now) {
      ViewUtil.setCssSync(this.$el, () => this.$el.css('opacity', 1));
    } else {
      ViewUtil.animateCss(this.$el,
          () => this.$el.css('opacity', 0),
          () => this.$el.css('opacity', 1),
          null);
    }
  }

  // override
  hide(callback) {
    if (!ViewUtil.isDisplayed(this.$el)) {
      this.clear();
      if (callback) {
        callback();
      }
      return;
    }
    ViewUtil.animateCss(this.$el,
        () => this.$el.css('opacity', 1),
        () => this.$el.css('opacity', 0),
        () => {
          ViewUtil.setDisplayed(this.$el, false);
          this.clear();
          if (callback) {
            callback();
          }
        });
  }


  // override
  setAlbums(albums) {
    this.albums = [...albums];
    // For search results, we are only ever ordering items by artist/album
    this.albums.sort(LibraryDataUtil.sortByArtistThenAlbum);
  }

  /**
   * Data + dom only ever get generated thru here
   */
  setSearchTypeAndValue(type, value='') {
    this.searchType = type;
    this.searchValue = value.toLowerCase();
    Settings.librarySearchType = type;
    Settings.librarySearchValue = value || '';
    this.makeGroups();
    this.populateDom();
    this.$el.parent()[0].scrollTop = 0;
    $(document).trigger('library-search-view-populated');
  }

  getSearchType() {
    return this.searchType;
  }

  makeGroups() {
    let o;
    switch (this.searchType) {
      case 'artist':
        o = this.makeArtistGroups();
        break;
      case 'album':
        o = this.makeAlbumsGroup();
        break;
      case 'genre':
        o = this.makeGenreGroups();
        break;
      case 'year':
        o = this.makeYearGroups();
        break;
      case 'track':
        o = this.makeTracksGroup();
        break;
      case 'albumFavorites':
        o = this.makeAlbumFavoritesGroup();
        break;
      case 'trackFavorites':
        o = this.makeTrackFavoritesGroup();
        break;
      default:
        cl('warning logic');
        break;
    }
    if (!o || !o['labels'] || !o['groups']) {
      o = {labels: [], groups: []};
    }
    this.labels = o['labels'];
    this.groups = o['groups'];
  }

  // override
  get groupCssClass() {
    return (this.searchType == 'track' || this.searchType == 'trackFavorites')
        ? 'libraryTrackGroup' : 'libraryAlbumGroup';
  }

  // override
  get labelCssClass() {
    return this.searchType;
  }

  // override
  populateGroupDiv($group, array) {
    if (this.searchType == 'track' || this.searchType == 'trackFavorites') {
      this.populateTrackGroupDiv($group, array);
    } else {
      super.populateGroupDiv($group, array);
    }
  }

  populateTrackGroupDiv($group, array) {
    const a = array.map(item => item['track']);
    const items$ = TrackListItemUtil.populateList($group, a);

    for (const $item of items$) {
      $item.find(".contextButton").on("click tap", this.onTrackListItemContextButton);
    }
  }

  // override
  makeListItem(data, index) {
    switch (this.searchType) {
      case 'artist':
      case 'album':
      case 'genre':
      case 'year':
      case 'albumFavorites':
        return LibraryContentList.makeAlbumListItem(data);
        break;
      case 'track':
      case 'trackFavorites':
        return this.makeTrackListItem(data, index);
        break;
    }
    cl('warning logic');
    return null;
  }

  getItemCount() {
    if (!this.groups) {
      return 0;
    }
    let count = 0;
    for (const group of this.groups) {
      count += group.length;
    }
    return count;
  }

  /**
   * Returns groups of albums of artists
   * whose names include the search term.
   */
  makeArtistGroups() {
    if (!this.searchValue) {
      return { labels: [], groups: []}
    }
    const artists = {};
    for (const album of this.albums) {
      const artist = album['@_artist'].toLowerCase();
      if (artist && artist.includes(this.searchValue)) {
        if (!artists[artist]) {
          artists[artist] = [];
        }
        artists[artist].push(album);
      }
    }
    const labels = [];
    const groups = [];
    let keys = Object.keys(artists);
    keys.sort();
    for (const key of keys) {
      const group = artists[key];
      groups.push(group);

      // We lowercase'd the key earlier, so get 'original' version
      let label = group[0]['@_artist'] || key;
      labels.push(label);
    }
    return { labels: labels, groups: groups}
  }

  makeGenreGroups() {
    if (!this.searchValue) {
      return { labels: [], groups: [] }
    }
    return LibraryGroupUtil.makeGenreGroups(this.albums, this.searchValue);
  }

  makeYearGroups() {
    if (!this.searchValue) {
      return { labels: [], groups: [] }
    }
    return LibraryGroupUtil.makeYearGroups(this.albums, this.searchValue);
  }

  /**
   * Returns array of one group
   * whose album names include the search term.
   */
  makeAlbumsGroup() {
    if (!this.searchValue) {
      return { labels: [], groups: []}
    }
    const group = [];
    for (const album of this.albums) {
      const name = album['@_album'];
      if (name && name.toLowerCase().includes(this.searchValue)) {
        group.push(album);
      }
    }
    return { labels: [], groups: [group] };
  }

  /**
   * Returns list of tracks whose names include the search term.
   * Basically.
   */
  makeTracksGroup() {
    if (!this.searchValue) {
      return { labels: [], groups: []}
    }
    const group = [];
    for (const album of this.albums) {
      const tracks = AlbumUtil.getTracksOf(album);
      for (const track of tracks) {
        const song = track['@_song'];
        if (song && song.toLowerCase().includes(this.searchValue)) {
          // note special format in this case
          const o = { track: track, album: album };
          group.push(o);
        }
        if (group.length >= 500) {
          return { labels: [], groups: [group] };
        }
      }
    }
    return { labels: [], groups: [group] };
  }

  /**
   * Returns array of one group whose albums are favorited.
   */
  makeAlbumFavoritesGroup() {
    const group = [];
    for (const album of this.albums) {
      const hash = album['@_hash'];
      if (MetaUtil.isAlbumFavoriteFor(hash)) {
        group.push(album);
        if (group.length >= 500) {
          return { labels: [], groups: [group] };
        }
      }
    }
    return { labels: [], groups: [group] };
  }

  /**
   * Returns list of favorited tracks.
   */
  makeTrackFavoritesGroup() {
    const group = [];
    for (const album of this.albums) {
      const tracks = AlbumUtil.getTracksOf(album);
      for (const track of tracks) {
        const hash = track['@_hash'];
        if (MetaUtil.isTrackFavoriteFor(hash)) {
          // note special format in this case
          const o = { track: track, album: album };
          group.push(o);
        }
        if (group.length >= 500) {
          return { labels: [], groups: [group] };
        }
      }
    }
    return { labels: [], groups: [group] };
  }

  //(index, item, itemPrevious, itemNext, hasAlbum) {
  // todo is this used?
  makeTrackListItem(data, index) {
    const track = data['track'];
    const album = data['album'];
    const artistDiv = album['@_artist'] ? `<div class="artist">${album['@_artist']}</div>` : '';
    const albumDiv = album['@_album'] ? `<div class="album">${album['@_album']}</div>` : '';
    const favoriteSelectedClass = 'isFavorite'; // temp
    let s = '';
    s += `<div class="libraryTrackItem">`;
    s += `  <div class="content">`;
    s += `    <div class="song">${track['@_song'] || ''}</div>`;
    s +=      artistDiv;
    s +=      albumDiv;
    s += `  </div>`;
    s += `  <div class="trackItemMeta">`;
    s += `    <div class="numViews">${999 || ''}</div>`;
    s += `    <div class="iconButton toggleButton favoriteButton ${favoriteSelectedClass}" data-index="${index}"></div>`;
    s += `  </div>`;
    s += `  <div class="iconButton moreButton" data-index="${index}"></div>`;
    s += `</div>`;
    const $item = $(s);
    $item.find('.moreButton').on('click tap', this.onTrackListItemContextButton);
    return $item;
  }

  // override
  onItemClick(e) {
    if (this.searchType == 'track') {
      // track list items aren't clickable (only their more buttons)
      return;
    }
    super.onItemClick(e)
  }

  onTrackListItemContextButton = (e) => {
    event.stopPropagation();
    const $button = $(e.currentTarget);
    const $listItem = $button.parent().parent();
    const index = $listItem.attr('data-index');
    if (!(index >= 0)) {
      return;
    }
    if (!this.groups || !this.groups[0]) {
      return;
    }
    const o = this.groups[0][index];
    if (!o || !o['track'] || !o['album']) {
      return;
    }
    TrackListItemContextMenu.show($('#libraryView'), $button, o);
  };
}
