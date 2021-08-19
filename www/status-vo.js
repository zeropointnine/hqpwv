/**
 * Simple value object wrapper around hqp <Status /> object.
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

  get isEmpty() { // yuk
    return (Object.keys(this._data).length == 0);
  }

  /**
   * Returns the currently playing song's metadata, or empty-object
   * @NonNull
   */
  get metadata() {
    const meta = this._data['metadata'];
    if (!meta) {
      return {};
    }
    if (this.isStopped) {
      // Meta is still returned after 'stop'.
      // Note too that hqp does _not_ go into its 'real' stopped state when it reports is-stopped
      // (does not free output device), which may have implications.
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
    return (!this.isPlaying && !this.isPaused);
  }
  get isStoppedExplicit() {
    return this._data['@_state'] == '0';
  }

  /** One-indexed track index; zero for none. */
  get track_do_not_use() {
    throw new Error('Unreliable, do not use');
    // return parseInt(this._data['@_track']) || 0;
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

  /**
   * Returns volume value, or NaN
   *
   * NB: Never cast a bad value to 0 (ie, full volume!!)
   */
  get volume() {
    const s = this._data['@_volume'];
    if (!s) {
      cl('warning no volume property');
      return NaN;
    }
    const volume = parseInt(s);
    if (isNaN(volume)) {
      cl('warning bad volume value');
      return NaN;
    }
    return volume;
  }
}