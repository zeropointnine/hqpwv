import Values from './values.js';
import Util from './util.js';
import Settings from './settings.js';
import Model from './model.js';

const HISTORY_MAX_ITEMS = 1000;

/**
 * Owns the hqpwv 'metadata layer' data.
 *
 * Loads data from server.
 * Manages that data locally.
 * On any mutate operation, pushes change to server (#goodenough).
 */
class MetaUtil {

  isServerEnabled;
  serverFilepath;

  isFailed;
  isInitialized;
  isReady;

  /**
   * JSON hash object that comes from hqpwv server
   * Key is track hash.
   * Value is an object { favorite, views }
   */
  meta;

  constructor() {}

  // todo promises. c'mon.
  init() {

    // Dev convenience:
    if (!window.hqpwv) {
      window.hqpwv = {};
    }
    window.hqpwv.MetaUtil = this;

    this.fetchInfo((result) => {
      if (!result) {
        return;
      }
      this.fetchMeta((result) => {
        if (!result) {
          return;
        }
        this.isReady = true;
      });
    });
  }

  fetchInfo(resultCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      this.isServerEnabled = (data.isEnabled);
      this.serverFilepath = (data.filepath);
      this.isInitialized = true;
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

  fetchMeta(resultCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      this.meta = data;
      if (!this.meta['tracks']) {
        cl('warning meta missing tracks');
        this.meta['tracks'] = {};
      }
      if (!this.meta['history']) {
        cl('warning meta missing history');
        this.meta['history'] = {};
      }
      resultCallback(true);
    };
    const onError = (e) => {
      this.isFailed = true;
      cl('warning get meta failed', e);
      resultCallback(false);
    };
    const url = `${Values.META_ENDPOINT}?getData`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  get isEnabled() {
    return (Settings.isMetaEnabled && this.isReady); // todo isServerEnabled?
  }

  // ---
  // History

  get history() {
    return this.meta['history'];
  }

  // ---
  // Track-related

  isFavoriteFor(hash) {
    if (!this.meta['tracks'][hash]) {
      return false;
    }
    const o = this.meta['tracks'][hash];
    const value = o['favorite'];
    return (value === true || value === 'true');
  }

  /**
   * Sets track favorite boolean, and tells server to do likewise.
   */
  setFavoriteFor(hash, isFavorite) {
    if (!hash) {
      return false;
    }
    let o = this.meta['tracks'][hash];
    if (!o) {
      this.meta['tracks'][hash] = {};
      o = this.meta['tracks'][hash];
    }
    o['favorite'] = isFavorite;

    this.pushTrackFavorite(hash, isFavorite);
  }

  getNumViewsFor(hash) {
    let o = this.meta['tracks'][hash];
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
    let o = this.meta['tracks'][hash];
    if (!o) {
      this.meta['tracks'][hash] = {};
      o = this.meta['tracks'][hash];
    }
    const newValue = this.getNumViewsFor(hash) + 1;
    o['views'] = newValue;
    this.pushIncrementTrackViews(hash);

    // Also add to history (Server will have done the same as well!)
    this.addToHistory(hash);

    $(document).trigger('meta-track-incremented', [hash, newValue]);
  }

  addToHistory(hash) {
    const a = this.meta['history'];
    const o = {
      'hash': hash,
      'time': new Date().getTime()
    };
    a.push(o);
    const excess = a.length - HISTORY_MAX_ITEMS;
    if (excess > 0) {
      a.splice(0, excess)
    }
  }

  // ---
  // Push-to-server-related

  pushTrackFavorite(hash, isFavorite) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { /*cl(data);*/ };
    const onError = (e) => cl('warning update track favorite failed', e);
    const url = `${Values.META_ENDPOINT}?updateTrackFavorite&hash=${hash}&value=${isFavorite}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  pushIncrementTrackViews(hash) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { /*cl(data);*/ };
    const onError = (e) => cl('warning increment track views failed', e);
    const url = `${Values.META_ENDPOINT}?incrementTrackViews&hash=${hash}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }
}

export default new MetaUtil();
