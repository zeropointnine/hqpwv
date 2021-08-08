import Commands from './commands.js';
import StatusVo from './status-vo.js';
import StateVo from './state-vo.js';
import LibraryVo from './library-vo.js';

/**
 * Model
 * Data comes from hqp and is json-converted by the webserver.
 */
class Model {

	_library = new LibraryVo();
	_status = new StatusVo();
  _lastStatus = new StatusVo();
  _state = new StateVo();
	_playlistData = [];
  _infoData = {};

  constructor() {
    // Dev convenience:
    if (!window.hqpwv) {
      window.hqpwv = {};
    }
    window.hqpwv.Model = this;
  }

  // @NonNull
	get library() {
		return this._library;
	}

	setLibraryDataUsingResponseObject(data) {
		this._library = new LibraryVo(data);
		$(document).trigger('model-library-updated');
	}

  // @NonNull
	get status() {
		return this._status;
	}

  // @NonNull
  get lastStatus() {
    return this._lastStatus;
  }

	setStatusUsingResponseObject(data) {
		this._lastStatus = this._status;
    this._status = new StatusVo(data);
		$(document).trigger('model-status-updated');
	}

  // @NonNull
  get state() {
    return this._state;
  }

  setStateUsingResponseObject(data) {
    this._state = new StateVo(data);
    $(document).trigger('model-state-updated');
  }

  // @NonNull
	get playlistData() {
		return this._playlistData;
	}

	setPlaylistDataUsingResponseObject(data) {
		if (!data['PlaylistGet'] || !data['PlaylistGet']['PlaylistItem']) {
      cl('warning missing expected property', data);
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