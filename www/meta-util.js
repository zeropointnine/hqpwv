import Values from './values.js';
import Util from './util.js';
import Settings from './settings.js';
import Model from './model.js';

/**
 *
 */
class MetaUtil {

  isServerEnabled;
  serverFilepath;

  isFailed;
  isInitialized;
  isReady;

  meta;

  constructor() {}

  // todo promises. c'mon.
  init() {
    this.getInfo((result) => {
      if (!result) {
        return;
      }
      this.getMeta((result) => {
        if (!result) {
          return;
        }
        this.mergeIfPossible();
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

  // Iterate library tracks, and 'decorate' w/ meta.
  mergeIfPossible() {
    if (Model.libraryData.length == 0 || this.meta == null) {
      return;
    }
    for (const album of Model.libraryData) {
      const tracks = Model.getTracksOf(album);
      for (const track of tracks) {
        this.decorateTrack(track);
      }
    }
    this.isReady = true;
  }

  decorateTrack(track) {
    const hash = track['@_hash'];
    if (!hash) {
      return;
    }
    const o = this.meta[hash];
    if (!o) {
      return;
    }
    track['wvmeta'] = o;
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

  // ---

  get isEnabled() {
    return (Settings.isMetaEnabled && this.isReady);
  }

  isFavorite(metaObject) {
    if (!metaObject) {
      return false;
    }
    const value = metaObject['favorite'];
    if (value === undefined) {
      return false;
    }
    return (value === true || value === 'true');
  }
}

export default new MetaUtil();