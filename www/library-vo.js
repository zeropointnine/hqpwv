/**
 * Value object wrapper around hqp <Library /> object.
 */
export default class LibraryVo {

  _array;

  // Cache objects:
  /** Key is hash, value is library item (album) */
  _hashToItem;
  /** Key is uri, value is track hash. */
  _uriToHash;
  /** Key is track hash. Value is [track, album] */
  _historyLookup = null;

  constructor(responseObject=null) {
    let array;
    if (!responseObject) {
      array = [];
    } else if (!responseObject['LibraryGet']) {
      cl('warning missing expected property');
      array = [];
    } else {
      array = responseObject['LibraryGet']['LibraryDirectory'];
      if (!array) {
        cl('warning missing expected property');
        array = []
      } else {
        if (!Array.isArray(array)) {
          array = [array];
        }
      }
    }
    this.array = array;
  }

  /** Direct access to array. */
  get array() {
    return this._array;
  }

  set array(a) {
    this._array = a;
    this.initUriToHash();
  }

  // @Nullable
  getItemByHash(hash) {
    if (!this._hashToItem) {  // lazy init
      this._hashToItem = {};
      for (const item of this._array) {
        const key = item['@_hash'];
        this._hashToItem[key] = item;
      }
    }
    return this._hashToItem[hash];
  }

  // @Nullable
  getHashForUri(uri) {
    const hash = this._uriToHash[uri];
    if (!hash) {
      cl('info no hash for', uri);
    }
    return hash;
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
    return this.getHashForUri(uri);
  }

  /**
   * Find library item that contains the given track
   * (Rem, a playlist item added via hqp does not have to exist in the library)
   *
   * uri example: "file:///Volumes/MUSICBIG/nZk/01_AZ.flac"
   * path example: "/Volumes/MUSICBIG/nZk" (MacOS)
   */
  getLibraryItemByTrackUri(uri) {
    let libraryItem;
    for (const item of this._array) {
      const itemPath = item['@_path'];
      if (uri.includes(itemPath)) {
        libraryItem = item;
        break;
      }
    }
    return libraryItem;
  }

  getTrackAndAlbumByHash(hash) {
    if (!this._historyLookup) {
      this.initHistoryLookup(); // lazy init
    }
    return this._historyLookup[hash];
  }

  initUriToHash() {
    this._uriToHash = {};
    for (const album of this.array) {
      let tracks = album['LibraryFile'];
      if (!Array.isArray(tracks)) {
        tracks = [tracks];
      }
      for (const track of tracks) {
        const uri = 'file://' + album['@_path'] + '/' + track['@_name']
        const hash = track['@_hash'];
        this._uriToHash[uri] = hash;
      }
    }
  }

  initHistoryLookup() {
    this._historyLookup = {};
    for (const album of this.array) {
      let tracks = album['LibraryFile'];
      if (!Array.isArray(tracks)) {
        tracks = [tracks];
      }
      for (const track of tracks) {
        const hash = track['@_hash'];
        this._historyLookup[hash] = [track, album];
      }
    }
  };
}