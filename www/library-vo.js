/**
 * Value object wrapper around hqp <Library /> object.
 */
export default class LibraryVo {

  _array;
  _lookup;

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
    this.initLookup();
  }

  // @Nullable
  getHashForUri(uri) {
    const hash = this._lookup[uri];
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

  initLookup() {
    this._lookup = {};
    for (const album of this.array) {
      let tracks = album['LibraryFile'];
      if (!Array.isArray(tracks)) {
        tracks = [tracks];
      }
      for (const track of tracks) {
        const uri = 'file://' + album['@_path'] + '/' + track['@_name']
        const hash = track['@_hash'];
        this._lookup[uri] = hash;
      }
    }
  }
}