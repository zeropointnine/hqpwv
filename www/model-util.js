/**
 * Higher level util functions on model data.
 */
import Values from './values.js';
import Model from './model.js';

class ModelUtil {

  static getAlbumImageUrl(album) {
    return Values.imagesEndpoint + album['@_hash']
  }

  static doesAlbumContainPlayingSong(album) {
    /*
      status metadata uri property looks like this:
        "file:///some path/my album/my track.wav"
      albumObject path property looks like this:
        "/some path/my album"
    */
    if (Model.status.isStopped) {
      return false; // See comment above
    }
    if (!album) {
      return false;
    }
    const meta = Model.status.metadata;
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
    const meta = Model.status.metadata;
    const metaUri = meta['@_uri'];
    const trackName = track['@_name']; // ie, filename
    if (!metaUri || !trackName) {
      return false;
    }
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
  }
}

export default ModelUtil;