import Values from './values.js';
import Util from './util.js';
import Settings from './settings.js';
import Model from './model.js';

/**
 * Manages hqpwv 'metadata layer'.
 * Loads data from server.
 * On any mutate operation, pushes change to server to keep it in sync.
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

    this.getInfo((result) => {
      if (!result) {
        return;
      }
      this.getMeta((result) => {
        if (!result) {
          return;
        }
        this.isReady = true;
      });
    });
  }

  getInfo(resultCallback) {
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

  getMeta(resultCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      this.meta = data;
      resultCallback(true);
    };
    const onError = (e) => {
      this.isFailed = true;
      cl('warning get meta failed', e);
      resultCallback(false);
    };
    const url = `${Values.META_ENDPOINT}?getTracks`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  get isEnabled() {
    return (Settings.isMetaEnabled && this.isReady);
  }

  // ---

  isFavoriteFor(hash) {
    if (!this.meta[hash]) {
      return false;
    }
    const o = this.meta[hash];
    const value = o['favorite'];
    return (value === true || value === 'true');
  }

  setFavoriteFor(hash, isFavorite) {
    if (!hash) {
      return false;
    }
    let o = this.meta[hash];
    if (!o) {
      this.meta[hash] = {};
      o = this.meta[hash];
    }
    o['favorite'] = isFavorite;

    this.updateTrackFavorite(hash, isFavorite);
  }

  getNumViewsFor(hash) {
    let o = this.meta[hash];
    if (!o) {
      return 0;
    }
    let numViews = parseInt( o['views'] );
    if (isNaN(numViews)) {
      numViews = 0;
    }
    return numViews;
  }

  incrementNumViewsFor(hash) {
    if (!hash) {
      return;
    }
    let o = this.meta[hash];
    if (!o) {
      this.meta[hash] = {};
      o = this.meta[hash];
    }
    const newValue = this.getNumViewsFor(hash) + 1;
    o['views'] = newValue;

    this.updateTrackViews(hash, newValue);
  }

  // ---

  updateTrackFavorite(hash, isFavorite) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { };
    const onError = (e) => cl('warning update track favorite failed', e);
    const url = `${Values.META_ENDPOINT}?updateTrackFavorite&hash=${hash}&value=${isFavorite}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

  updateTrackViews(hash, numViews) {
    if (!hash) {
      cl('warning no hash');
      return;
    }
    const onSuccess = (data, textStatus, jqXHR) => { };
    const onError = (e) => cl('warning update track views failed', e);
    const url = `${Values.META_ENDPOINT}?updateTrackViews&hash=${hash}&value=${numViews}`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }

}

export default new MetaUtil();