/**
 * Misc functions related to hqplayer and service data.
 */
import Values from './values.js';
import Model from './model.js';


class DataUtil {

  static NO_ERROR_TEXT_TEXT = "error";

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
  static isResultOk(dataObject) {
    const keys = Object.keys(dataObject);
    if (keys.length != 1) {
      cl('warning object has more than on key', dataObject);
      return undefined;
    }
    const o = dataObject[keys[0]];
    if (o['@_result'] === undefined) {
      cl('warning no result property', dataObject, o);
      return undefined;
    }
    const b = o['@_result'] == 'OK';
    if (!b) {
      cl('result !OK', dataObject);
    }
    return b;
  }

  /**
   * Returns error text if `dataObject` explicitly has 'result = error' info.
   */
  static isResultError(dataObject) {
    const keys = Object.keys(dataObject);
    if (keys.length != 1) {
      return null;
    }
    const o = dataObject[keys[0]];
    if (o['@_result'] === undefined) {
      return null;
    }
    if (o['@_result'] != 'Error') {
      return null;
    }
    return (o['#text']) ? o['#text'] : DataUtil.NO_ERROR_TEXT_TEXT;
  }

  static getAlbumImageUrl(album) {
    return Values.imagesEndpoint + album['@_hash']
  }

  /** Where track is assumed to be from album. */
  static makeUriUsingAlbumAndTrack(album, track) {
    const uri = `file://${album['@_path']}/${track['@_name']}`; // todo system directory separator char
    return uri;
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
    if (!DataUtil.doesAlbumContainPlayingSong(album)) {
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
}

export default DataUtil;
