import Commands from './commands.js';

/**
 * Model
 * Data comes from hqp and is json-converted by the webserver.
 */
class Model {

	_libraryData = [];
	_statusData = {};
  _lastStatusData = {};
	_playlistData = [];
  _infoData = {};

	get libraryData() {
		return this._libraryData;
	}

	setLibraryDataUsingResponseObject(data) {
		this._libraryData = data['LibraryGet']['LibraryDirectory'] || [];
		$(document).trigger('model-library-updated');
	}

	get statusData() {
		return this._statusData;
	}

  get lastStatusData() {
    return this._lastStatusData;
  }

	setStatusDataUsingResponseObject(data) {
		this._lastStatusData = this._statusData;
    this._statusData = data;
		$(document).trigger('model-status-updated');
	}

	get playlistData() {
		return this._playlistData;
	}

	setPlaylistDataUsingResponseObject(data) {
		if (!data['PlaylistGet'] || !data['PlaylistGet']['PlaylistItem']) {
      this._playlistData = [];
    } else {
      this._playlistData = data['PlaylistGet']['PlaylistItem'];
    }
    // When just one element, item is not wrapped in an array, so wrap it.
    if (!Array.isArray(this._playlistData)) {
      this._playlistData = [this._playlistData];
    }
		$(document).trigger('model-playlist-updated');
	}

  get infoData() {
    return this._infoData;
  }

  setInfoUsingResponseObject(data) {
    this._infoData = data['GetInfo'] ? data['GetInfo'] : {};
    $(document).trigger('model-info-updated');
  }

  // ---
	// Convenience functions

	/** 
	 * Returns array of track objects from album object. 'Non-null'. 
	 */
	getTracksOf(albumObject) {
		if (!albumObject['LibraryFile']) {
			return [];
		}
		const value = albumObject['LibraryFile'];
		return Array.isArray(value) ? value : [value];
	}

  /**
   * Find library item that contains the given track 
   * (Rem, a playlist item does not have to exist in the library)
	 *
   * uri example: "file:///Volumes/MUSICBIG/nZk/01_AZ.flac"
   * path example: "/Volumes/MUSICBIG/nZk"
   * (this is on mac; hopefully this works out for windows as well)
   */
  getLibraryItemByTrackUri(uri) {
    let libraryItem;
    for (const libItem of this._libraryData) {
      const libItemPath = libItem['@_path'];
      if (uri.includes(libItemPath)) {
        libraryItem = libItem;
        break;
      }
    }
    return libraryItem;
  }

  /** Returns -1 if bad data. */
  getStatusTrackCurrentSeconds() {
    if (!this._statusData) {
      return -1
    }
    const min = parseInt(this._statusData['@_min']);
    if (isNaN(min)) {
      return -1;
    }
    const sec = parseInt(this._statusData['@_sec']);
    if (isNaN(sec)) {
      return -1;
    }
    return (min * 60) + sec;
  }

  /** Returns -1 if bad data. */
  getStatusTrackTotalSeconds() {
    if (!this._statusData) {
      return -1;
    }
    const min = parseInt(this._statusData['@_total_min']);
    if (isNaN(min)) {
      return -1;
    }
    const sec = parseInt(this._statusData['@_total_sec']);
    if (isNaN(sec)) {
      return -1;
    }
    return (min * 60) + sec;
  }

  /** Returns -1 if bad data. */
  getStatusTrackSecondsFromRatio(ratio) {
    let sec = this.getStatusTrackTotalSeconds();
    if (sec == -1) {
      return -1;
    }
    return Math.floor(ratio * sec);
  }

  /** Returns empty string on bad data. */
  makeBitrateDisplayText(album) {
    const rate = parseInt(album['@_rate']); // hertz
    const bits = parseInt(album['@_bits']);
    if (!(rate > 0) || !(bits > 0)) {
      return '';
    }
    return `${Math.floor(rate/1000)}/${bits}`;
  }
}

// Singleton
export default new Model();