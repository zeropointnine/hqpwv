/**
 * User settings, which get persisted to local storage.
 */
class Settings {

  storage = window.localStorage;

  _librarySortType;
  _hqpPresets = [];

  constructor() {
    // Load values from local storage
    this._librarySortType = this.storage.getItem('librarySortType');
    if (this._librarySortType == null) {
      this._librarySortType = 'artist'; // default
    }

    const value = this.storage.getItem('hqpPresets');
    let array;
    try {
      array = JSON.parse(value);
    } catch (exc) {
      cl(exc);
    }
    if (!array) {
      array = [];
    }
    this._hqpPresets = array;
  }

  get librarySortType() {
    return this._librarySortType;
  }

  set librarySortType(s) {
    this._librarySortType = s;
    this.storage.setItem('librarySortType', s);
  }

  get hqpPresets() {
    return this._hqpPresets;
  }

  commitHqpPresets() {
    const s = JSON.stringify(this._hqpPresets);
    this.storage.setItem('hqpPresets', s);
  }
}

export default new Settings();