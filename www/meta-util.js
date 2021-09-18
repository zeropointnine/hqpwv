import Values from './values.js';
import Util from './util.js';
import Settings from './settings.js';
import Model from './model.js';
import ToastView from './toast-view.js';

const HISTORY_MAX_ITEMS = 1000;

const TRACKS_KEY = 'tracks-r2';
const HISTORY_KEY = 'history-r2';
const ALBUMS_KEY = 'albums';

/**
 * Owns the hqpwv 'metadata layer' data.
 *
 * Loads data from server.
 * Manages that data locally.
 * On any mutate operation, pushes change to server (#goodenough).
 */
class MetaUtil {

  isServerEnabled;
  serverMainFilepath;

  isLoading;
  isFailed;
  isReady;

  _tracks = {};
  _albums = {};
  _history = [];
  
  constructor() {}

  init() {
    // Dev convenience
    if (!window.hqpwv) {
      window.hqpwv = {};
    }
    window.hqpwv.MetaUtil = this;

    this.isLoading = true;

    this.fetchInfo((result) => {
      if (!result) {
        cl('warning meta info failed');
        this.doFail();
        return;
      }
      this.fetchMain((result) => {
        if (!result) {
          cl('warning meta main failed');
          this.doFail();
          return;
        }
        this.doSuccess();
      });
    });
  }

  doFail() {
    this.isLoading = false;
    this.isFailed = true;
    ToastView.show(`<span class="colorAccent">Server metadata init failed; some features will be disabled.</span>`, 5000);
    $(document).trigger('meta-load-result', false);
  }

  doSuccess() {
    this.isLoading = false;
    this.isFailed = false;
    this.isReady = true;
    $(document).trigger('meta-load-result', true);
  }

  fetchInfo(resultCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      this.isServerEnabled = data['isEnabled'];
      this.serverMainFilepath = data['mainFilepath'];
      resultCallback(true);
    };
    const onError = (e) => {
      this.isFailed = true;
      cl('warning get info failed', e);
      resultCallback(false);
    };
    const url = `${Values.META_ENDPOINT}?info`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  fetchMain(resultCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      if (!!data['error']) {
        cl('warning', data['error']);
        resultCallback(false);
        return;
      }
      if (!data[TRACKS_KEY] || !data[ALBUMS_KEY] || !data[HISTORY_KEY]) {
        cl('warning missing required property', data);
        resultCallback(false);
        return;
      }
      this._tracks = data[TRACKS_KEY];
      this._albums = data[ALBUMS_KEY];
      this._history = data[HISTORY_KEY];
      resultCallback(true);
    };
    const onError = (e) => {
      this.isFailed = true;
      cl('warning get meta failed', e);
      resultCallback(false);
    };

    const url = `${Values.META_ENDPOINT}?getMain`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  get isEnabled() {
    return (Settings.isMetaEnabled && this.isReady); // todo isServerEnabled?
  }

  get tracks() {
    return this._tracks;
  }

  get albums() {
    return this._albums;
  }

  get history() {
    return this._history;
  }

  isTrackFavoriteFor(hash) {
    if (!this._tracks[hash]) {
      return false;
    }
    const o = this._tracks[hash];
    const value = o['favorite'];
    return (value === true || value === 'true');
  }

  isAlbumFavoriteFor(hash) {
    if (!this._albums[hash]) {
      return false;
    }
    const o = this._albums[hash];
    const value = o['favorite'];
    return (value === true || value === 'true');
  }

  /**
   * Sets track favorite boolean, and tells server to do likewise.
   */
  setTrackFavoriteFor(hash, isFavorite) {
    if (!hash) {
      return false;
    }
    let o = this._tracks[hash];
    if (!o) {
      this._tracks[hash] = {};
      o = this._tracks[hash];
    }
    o['favorite'] = isFavorite;
    $(document).trigger('meta-track-favorite-changed', hash);

    this.setTrackFavoriteOnServer(hash, isFavorite);
  }

  setTrackFavoriteOnServer(hash, isFavorite) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { /*cl(data);*/ };
    const onError = (e) => cl('warning update track favorite failed', e);
    const url = `${Values.META_ENDPOINT}?updateTrackFavorite&hash=${hash}&value=${isFavorite}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  /**
   * Sets album favorite boolean, and tells server to do likewise.
   */
  setAlbumFavoriteFor(hash, isFavorite) {
    if (!hash) {
      return false;
    }
    let o = this._albums[hash];
    if (!o) {
      this._albums[hash] = {};
      o = this._albums[hash];
    }
    o['favorite'] = isFavorite;

    this.setAlbumFavoriteOnServer(hash, isFavorite);

    $(document).trigger('album-favorite-changed', [hash, isFavorite]);
  }

  setAlbumFavoriteOnServer(hash, isFavorite) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { /*cl(data);*/ };
    const onError = (e) => cl('warning update album favorite failed', e);
    const url = `${Values.META_ENDPOINT}?updateAlbumFavorite&hash=${hash}&value=${isFavorite}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  getNumViewsFor(hash) {
    let o = this._tracks[hash];
    if (!o) {
      return 0;
    }
    let numViews = parseInt( o['views'] );
    if (isNaN(numViews)) {
      numViews = 0;
    }
    return numViews;
  }

  /**
   * Increments num-views for track, and tells server to do the same.
   */
  incrementTrackViewsFor(hash) {
    if (!hash) {
      return;
    }
    let o = this._tracks[hash];
    if (!o) {
      this._tracks[hash] = {};
      o = this._tracks[hash];
    }
    const newValue = this.getNumViewsFor(hash) + 1;
    o['views'] = newValue;
    this.incrementTrackViewsOnServer(hash);

    // Also add to history (Server will have done the same as well!)
    this.addToHistory(hash);

    $(document).trigger('meta-track-incremented', hash);
  }

  incrementTrackViewsOnServer(hash) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { /*cl(data);*/ };
    const onError = (e) => cl('warning increment track views failed', e);
    const url = `${Values.META_ENDPOINT}?incrementTrackViews&hash=${hash}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  addToHistory(hash) {
    const o = {
      'hash': hash,
      'time': new Date().getTime()
    };
    this._history.push(o);
    const excess = this._history.length - HISTORY_MAX_ITEMS;
    if (excess > 0) {
      this._history.splice(0, excess)
    }
  }
}

export default new MetaUtil();
