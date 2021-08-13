import Model from './model.js';

/**
 * Value object wrapper around hqp <PlaylistGet /> object.
 */
export default class PlaylistVo {

  _array;

  constructor(responseObject=null) {
    if (!responseObject) {
      this._array = [];
    } else if (!responseObject['PlaylistGet']) {
      cl('warning missing top-level property', responseObject);
      this._array = [];
    } else if (!responseObject['PlaylistGet']['PlaylistItem']) {
      // Library is empty
      this._array = [];
    } else {
      this._array = responseObject['PlaylistGet']['PlaylistItem'];
    }
    if (!Array.isArray(this._array)) {
      // When just one element, item is not wrapped in an array
      this._array = [this._array];
    }
  }

  // @NonNull
  get array() {
    return this._array;
  }

  /** Gets item index by uri. */
  getIndexByUri(uri=null) {
    if (!uri) {
      return -1;
    }
    for (let i = 0; i < this._array.length; i++) {
      const item = this._array[i];
      if (item['@_uri'] == uri) {
        return i;
      }
    }
    return -1;
  }

  /** Gets the currently playing track's playlist index using the current Status object. */
  getCurrentIndex() {
    const uri = Model.status.metadata['@_uri'];
    if (!uri) {
      return -1;
    }
    return this.getIndexByUri(uri);
  }
}