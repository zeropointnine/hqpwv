/**
 * Value object simple wrapper around the hqp <Status /> object.
 */
export default class StatusVo {

  _data;

  constructor(statusObject) {
    this._data = statusObject;
  }

  get data() {
    return _data;
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

  get metadata() {
    return this._data['metadata'];
  }
}