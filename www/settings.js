/**
 * User settings, which get persisted to local storage.
 */
class Settings {

  storage = window.localStorage;

  _librarySortType;

  constructor() {
    // Load values from local storage
    this._librarySortType = this.storage.getItem('librarySortType');
    if (this._librarySortType == null) {
      this._librarySortType = 'artist'; // default
    }
  }

  get librarySortType() {
    return this._librarySortType;
  }

  set librarySortType(s) {
    this._librarySortType = s;
    this.storage.setItem('librarySortType', s);
  }
}

export default new Settings();