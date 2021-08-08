/**
 * Simple value object wrapper around hqp <State /> object.
 */
export default class StateVo {

  _data;

  constructor(responseObject=null) {
    if (!responseObject) {
      this._data = {}
    } else if (!responseObject['State']) {
      cl('warning missing expected property', data);
      this._data = {};
    } else {
      this._data = responseObject['State'];
    }
    cl('statevo', this._data)
  }

  /** Direct access to the 'unwrapped' data object. */
  get data() {
    return this._data;
  }

  // Playlist-repeat related:

  get isNotRepeat() {
    return (!this.isRepeatAll && !this.isRepeatOne);
  }

  get isRepeatAll() {
    return (this._data['@_repeat'] == '2');
  }

  get isRepeatOne() {
    return (this._data['@_repeat'] == '1');
  }
}