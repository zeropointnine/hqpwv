/**
 * Value object simple wrapper around the hqp <Status /> object.
 */
export default class StatusVo {

  _data;

  constructor(statusObject) {
    this._data = statusObject || {};
  }

  /** Direct access to the 'unwrapped' data object. */
  get data() {
    return this._data;
  }

  /** Returns the currently playing song's metadata, or empty-object */
  get metadata() {
    const meta = this._data['metadata'];
    if (!meta) {
      return {};
    }
    if (this.isStopped) {
      // Meta is still returned after 'stop'.
      // Note too that the hqp app does _not_ go into a 'real' stopped state at this point,
      // which may have implications...
      return {};
    }
    return meta;
  }

  get isPlaying() {
    return this._data['@_state'] == '2';
  }
  get isPaused() {
    return this._data['@_state'] == '1';
  }
  get isStopped() {
    return this._data['@_stopped'] == '2';
  }

  /** Returns the 1-indexed track number (as integer) in the playlist, or -1. */
  get trackNum() {
    return parseInt(this._data['@_track']) || -1 ;
  }

  /** Returns playing track's progress in seconds, or -1. */
  get seconds() {
    const min = parseInt(this._data['@_min']);
    if (isNaN(min)) {
      return -1;
    }
    const sec = parseInt(this._data['@_sec']);
    if (isNaN(sec)) {
      return -1;
    }
    return (min * 60) + sec;
  }

  /** Returns playing track's length in seconds, or -1. */
  get totalSeconds() {
    const min = parseInt(this._data['@_total_min']);
    if (isNaN(min)) {
      return -1;
    }
    const sec = parseInt(this._data['@_total_sec']);
    if (isNaN(sec)) {
      return -1;
    }
    return (min * 60) + sec;
  }

  /** Returns playing track's position in seconds as float. */
  // TODO: revisit `seconds`
  get position() {
    return parseFloat(this._data['@_position']) || 0;
  }

  /** Returns -1 if bad data. */
  getSecondsFromRatio(ratio) {
    let sec = this.totalSeconds;
    if (sec == -1) {
      return -1;
    }
    return Math.floor(ratio * sec);
  }
}