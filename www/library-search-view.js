import AlbumUtil from './album-util.js';
import LibraryContentView from './library-content-view.js';
import LibraryDataUtil from './library-data-util.js';
import Model from './model.js';
import Settings from './settings.js';
import ViewUtil from './view-util.js';
import Util from './util.js';
import TrackListItemContextMenu from './track-list-item-context-menu.js';

/**
 * One of the two main library 'content views'.
 * Shows search results using artist name, album name, or tracks name (mutually exclusive).
 * Track results use own list item type (similar to history view).
 */
export default class LibrarySearchView extends LibraryContentView {

  searchType;
  searchValue;

  constructor($el) {
    super($el);
    this.hide();
    Util.addAppListener(this, 'library-search', this.onSearch);
    Util.addAppListener(this, 'library-albums-view-will-populate', this.onAlbumsWillPopulate);
    this.sortType = 'default';
  }

  // override
  setAlbums(albums) {
    this.albums = [...albums];
    // For search results, we are only ever ordering items by artist/album
    this.albums.sort(LibraryDataUtil.sortByArtistThenAlbum);
  }
  
  setSearchTypeAndValue(type, value) {
    this.searchType = type;
    this.searchValue = value;
    this.makeGroups();
    this.makeDom();
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
      case 'track':
        o = this.makeTracksGroup();
        break;
      default:
        cl('warning logic');
        o = {labels: [], groups: []};
        break;
    }
    this.labels = o['labels'];
    this.groups = o['groups'];
  }

  makeDom() {
    $(document).trigger('library-search-view-will-populate');
    super.makeDom();
  }

  // override
  makeLabel(label, group) {
    switch (this.searchType) {
      case 'artist':
        return LibraryContentView.makeLabel(label, '', group.length);
      case 'album':
        return '';
    }
    return '';
  }

  // override
  makeListItem(data, index) {
    switch (this.searchType) {
      case 'artist':
      case 'album':
        return LibraryContentView.makeAlbumListItem(data);
        break;
      case 'track':
        return this.makeTrackListItem(data, index);
        break;
    }
  }

  show() {
    ViewUtil.setDisplayed(this.$el, true);
    // rem, we're not populating dom on-show
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
  }

  /**
   * Returns groups of albums of artists
   * whose names include the search term.
   */
  makeArtistGroups() {
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
      // Add 'prefix'
      label = 'Artist: ' + label;
      labels.push(label);
    }
    return { labels: labels, groups: groups}
  }

  /**
   * Returns array of one group
   * whose album names include the search term.
   */
  makeAlbumsGroup() {
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
          break;
        }
      }
      if (group.length >= 500) {
        break;
      }
    }
    return { labels: [], groups: [group] };
  }

  makeTrackListItem(data, index) {
    const track = data['track'];
    const album = data['album'];
    const artistDiv = album['@_artist'] ? `<div class="artist">${album['@_artist']}</div>` : '';
    const albumDiv = album['@_album'] ? `<div class="album">${album['@_album']}</div>` : '';
    let s = '';
    s += `<div class="librarySearchTrackItem">`;
    s += `  <div class="content">`;
    s += `    <div class="song">${track['@_song'] || ''}</div>`;
    s +=      artistDiv;
    s +=      albumDiv;
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

  onSearch(type, value) {
    // 'Commit' the values to settings at this point
    Settings.librarySearchType = type;
    Settings.librarySearchValue = value;
    // Note how data and dom only ever gets generated thru here.
    this.setSearchTypeAndValue(type, value);
  }

  onTrackListItemContextButton = (e) => {
    event.stopPropagation();

    const $button = $(e.currentTarget);
    const index = $button.attr('data-index');
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

  onAlbumsWillPopulate = () => {
    this.clear();
  }
}
