import Util from './util.js';
import AlbumUtil from './album-util.js';

/**
 * Value object wrapper around hqp <Library /> object.
 */
export default class LibraryVo {

  // Array of album items
  _albums;
  // Array of library playlist items
  _hqPlaylistItems;

  // Cache objects:
  /** Key is hash, value is library item (album) */
  _albumHashToAlbum;
  /** Key is uri, value is track hash. */
  _trackUriToTrackHash;
  /** Key is track hash. Value is [track, album] */
  _trackHashLookup = null;
  /** Key is album path, value is album */
  _pathToItem;

  constructor(responseObject=null) {
    // Get main array from response object
    let responseArray;
    if (!responseObject) {
      responseArray = [];
    } else if (responseObject['LibraryGet'] == undefined) {
      cl('warning missing expected property');
      responseArray = [];
    } else if (responseObject['LibraryGet'] == '') {
      cl('info library is empty');
      responseArray = [];
    } else {
      responseArray = responseObject['LibraryGet']['LibraryDirectory'];
      if (!responseArray) {
        cl('warning missing expected property');
        responseArray = []
      } else {
        if (!Array.isArray(responseArray)) {
          responseArray = [responseArray];
        }
      }
    }
    this.init(responseArray);
  }

  /** Direct access to albums array. */  // todo rename
  get albums() {
    return this._albums;
  }

  get hqpPlaylistItems() {
    return this._hqPlaylistItems
  }

  // @Nullable
  getAlbumByAlbumHash(hash) {
    if (!this._albumHashToAlbum) {  // lazy init
      this._albumHashToAlbum = {};
      for (const item of this._albums) {
        const key = item['@_hash'];
        this._albumHashToAlbum[key] = item;
      }
    }
    return this._albumHashToAlbum[hash];
  }

  // @Nullable
  getTrackHashForTrackUri(uri) {
    return this._trackUriToTrackHash[uri];
  }

  // @Nullable
  getHashForPlaylistItem(item) {
    if (!item) {
      cl('warning playlistitem is null');
      return null;
    }
    if (!item['@_uri']) {
      cl('warning playlistitem has no uri');
      return null;
    }
    const uri = item['@_uri'];
    return this.getTrackHashForTrackUri(uri);
  }

  /**
   * Returns array of two elements (track and its containing album), or null.
   */
  getTrackAndAlbumByHash(hash) {
    if (!this._trackHashLookup) {
      this.initTrackHashLookup(); // lazy init
    }
    return this._trackHashLookup[hash];
  }

  getTrackByHash(hash) {
    const a = this.getTrackAndAlbumByHash(hash);
    return a ? a[0] : null;
  }

  getAlbumByTrackHash(hash) {
    const a = this.getTrackAndAlbumByHash(hash);
    return a ? a[1] : null;
  }

  /**
   * Find library item that contains the given track
   * (Rem, a playlist item added via hqp does not have to exist in the library)
   *
   * uri example: "file:///Volumes/MUSICBIG/nZk/01_AZ.flac"
   * path example: "/Volumes/MUSICBIG/nZk" (MacOS)
   */
  getAlbumByTrackUri(uri) {
    if (!this._pathToItem) { // lazy init
      this._pathToItem = {};
      for (const item of this._albums) {
        const path = item['@_path'];
        this._pathToItem[path] = item;
      }
    }
    let path = uri.replace('file://', '');
    path = Util.stripFilenameFromPath(path);
    return this._pathToItem[path];
  }

  getTrackByUri(uri) {
    const hash = this.getTrackHashForTrackUri(uri);
    if (!hash) {
      return null;
    }
    return this.getTrackByHash(hash)
  }

  // ---

  init(responseArray) {
    // Separate items into albums and playlists
    this._albums = [];
    this._hqPlaylistItems = [];
    for (let i = responseArray.length - 1; i >= 0; i--) {
      const item = responseArray[i];
      if (this.isAlbum(item)) {
        this._albums.push(item);
      } else if (this.isPlaylist(item)) {
        this._hqPlaylistItems.push(item);
      } else {
        // Happens eg w/ PGGB'd albums converted to wv, which oftentimes drops all metadata
        // cl('info item is not album or playlist, ignoring ', item['@_path']);
      }
    }

    // Sort teh playlists by name
    this._hqPlaylistItems.sort((a, b) => {
      const s1 = a['@_album'].toLowerCase();
      const s2 = b['@_album'].toLowerCase();
      if (s1 > s2) {
        return 1;
      } else if (s2 > s1) {
        return -1;
      } else {
        return 0;
      }
    });

    // Init album lookup
    this.initTrackUriToTrackHash();
  }

  isAlbum(item) {
    return !!(item['LibraryFile']);
  }

  isPlaylist(item) {
    if (!!(item['LibraryFile'])) {
      return false;
    }
    const path = item['@_path'];
    if (!path) {
      cl('warning bad data', item);
      return false;
    }
    return path.includes('.m3u');
  }

  initTrackUriToTrackHash() {
    this._trackUriToTrackHash = {};
    for (const album of this.albums) {
      const tracks = AlbumUtil.getTracksOf(album);
      for (const track of tracks) {
        const uri = 'file://' + album['@_path'] + '/' + track['@_name']
        const hash = track['@_hash'];
        this._trackUriToTrackHash[uri] = hash;
      }
    }
  }

  initTrackHashLookup() {
    this._trackHashLookup = {};
    for (const album of this.albums) {
      const tracks = AlbumUtil.getTracksOf(album);
      for (const track of tracks) {
        const hash = track['@_hash'];
        this._trackHashLookup[hash] = [track, album];
      }
    }
  };
}
