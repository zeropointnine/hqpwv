/**
 * Util functions for accessing data within the model's json objects.
 * Serves as good-enough substitute for a more formal model object system, etc.
 * Whenever applicable, inspect values inside the model data thru these static fns.
 */
import Values from './values.js';
import Model from './model.js';

class ModelUtil {

  static getAlbumImageUrl(album) {
    return Values.imagesEndpoint + album['@_hash']
  }

  static isPlaying() {
    return (Model.statusData['@_state'] == '2');
  }
  static isPaused() {
    return (Model.statusData['@_state'] == '1');
  }
  static isStopped() {
    return (!ModelUtil.isPlaying() && !ModelUtil.isPaused());
  }

  /**
   *  Returns the currently playing song's metadata
   *  untested
   */
  static getPlayingSongMetadata() {
    const meta = Model.statusData['metadata'];
    if (!meta) {
      return null;
    }
    if (ModelUtil.isStopped()) {
      // Meta is still returned after 'stop'.

      // Note too that the hqp app does _not_ go into a 'real' stopped state at this point,
      // which may have implications...
      return null;
    }
    return meta;
  }

  static doesAlbumContainPlayingSong(album) {
    /*
      status metadata uri property looks like this:
        "file:///some path/my album/my track.wav"
      albumObject path property looks like this:
        "/some path/my album"
    */
    if (ModelUtil.isStopped()) {
      return false; // See comment above
    }
    const meta = Model.statusData['metadata'];
    if (!meta || !album) {
      return false;
    }
    const a = meta['@_uri'];
    const b = album['@_path'];
    if (!a || !b) {
      return false;
    }
    return a.includes(b);
  }

  static doesAlbumSongEqualPlayingSong(album, track) {
    if (!ModelUtil.doesAlbumContainPlayingSong(album)) {
      return false;
    }
    const meta = Model.statusData['metadata'];
    const metaUri = meta['@_uri'];
    const trackName = track['@_name']; // ie, filename
    return metaUri.endsWith(trackName);
  }

  /**
   * From a given response json, returns the array (if any) which is two levels deep.
   * Many types of hqp response data uses this structure.
   * If no object exists at that path, returns empty array.
   * If the object at that path is not an array, wraps it in an array
   * (bc hqp returns single-item 'lists' unwrapped).
   */
  static getArrayFrom(data, key1, key2) {
    let array = (data[key1] && data[key1][key2])
        ? data[key1][key2]
        : [];
    if (!Array.isArray(array)) {
      array = [array];
    }
    return array;
  }

  /**
   * Checks for 2nd-level object's result property (wc many hqp responses have).
   * Returns `undefined` if object is not of expected structure.
   */
  static isResultOk(dataObject, key) {
    const keys = Object.keys(dataObject);
    if (keys.length != 1) {
      cl('warning object has more than on key', dataObject);
      return undefined;
    }
    const object2 = dataObject[keys[0]];
    if (object2['@_result'] === undefined) {
      cl('warning no result property', dataObject, object2);
      return undefined;
    }
    const b = object2['@_result'] == 'OK';
    if (!b) {
      cl('result !OK', dataObject);
    }
    return b;

    // todo remove
    //if (!dataObject[key]) {
    //  cl('warning: could be wrong top-level key', key, dataObject);
    //  return false;
    //}
    //if (dataObject[key]['@_result'] === undefined) {
    //  cl('warning: no result property', dataObject);
    //  return false;
    //}
    //const b = dataObject[key]['@_result'] == 'OK';
    //if (!b) {
    //  cl('result !OK', dataObject);
    //}
    //return b;
  }
}

export default ModelUtil;