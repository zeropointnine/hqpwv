import ThresholdRuleView from './threshold-rule-view.js';
import AbRuleView from './ab-rule-view.js';

/**
 * User settings, backed by local storage.
 */
class Settings {

  storage = window.localStorage;

  _metaEnabled;
  _librarySearchType;
  _librarySearchValue;
  _libraryGroupType;
  _librarySortType;
  _libraryBitratesArray;
  _libraryCollapsedGroups;
  _presetsArray;
  _currentRule;
  _thresholdRule;
  _abRule;

  constructor() {
    this.initFromLocalStorage();
  }

  initFromLocalStorage() {
    let s;

    this._metaEnabled = this.storage.getItem('metaEnabled') || 'true';

    this._librarySearchType = this.storage.getItem('librarySearchType') || 'track';

    this._librarySearchValue = this.storage.getItem('librarySearchValue') || '';

    this._libraryGroupType = this.storage.getItem('libraryGroupType') || 'none';

    s = this.storage.getItem('libraryCollapsedGroups');
    try {
      this._libraryCollapsedGroups = JSON.parse(s) || {};
    } catch (exc) {
      cl('warning', s, exc);
      this._libraryCollapsedGroups = {};
    }

    this._librarySortType = this.storage.getItem('librarySortType') || 'artist';

    s = this.storage.getItem('libraryBitratesArray');
    try {
      this._libraryBitratesArray = JSON.parse(s) || ['all'];
    } catch (exc) {
      cl('warning', s, exc);
      this._libraryBitratesArray = ['all'];
    }

    s = this.storage.getItem('presetsArray');
    try {
      this._presetsArray = JSON.parse(s) || [];
    } catch (exc) {
      cl('warning', s, exc);
      this._presetsArray = [];
    }

    this._currentRule = this.storage.getItem('currentRule') || '';

    s = this.storage.getItem('thresholdRule');
    try {
      this._thresholdRule = JSON.parse(s);
    } catch (exc) {
      cl('warning', s, exc);
    }
    if (!this._thresholdRule) {
      this._thresholdRule = ThresholdRuleView.getDefaultValues();
    }

    s = this.storage.getItem('abRule');
    try {
      this._abRule = JSON.parse(s);
    } catch (exc) {
      cl('warning', s, exc);
    }
    if (!this._abRule) {
      this._abRule = AbRuleView.getDefaultValues();
    }
  }

  get isMetaEnabled() {
    return (this._metaEnabled === 'true');
  }

  set isMetaEnabled(b) {
    const s = (b === true || b === 'true') ? 'true' : 'false';
    this._metaEnabled = s;
    this.storage.setItem('metaEnabled', s);
    $(document).trigger('settings-meta-changed');
  }

  get librarySearchType() {
    return this._librarySearchType;
  }

  set librarySearchType(s) {
    this._librarySearchType = s;
    this.storage.setItem('librarySearchType', s);
  }

  get librarySearchValue() {
    return this._librarySearchValue;
  }

  set librarySearchValue(s) {
    this._librarySearchValue = s;
    this.storage.setItem('librarySearchValue', s);
  }

  get libraryGroupType() {
    return this._libraryGroupType;
  }

  set libraryGroupType(s) {
    this._libraryGroupType = s;
    this.storage.setItem('libraryGroupType', s);
  }

  get librarySortType() {
    return this._librarySortType;
  }

  set librarySortType(s) {
    this._librarySortType = s;
    this.storage.setItem('librarySortType', s);
  }

  get libraryBitratesArray() {
    return this._libraryBitratesArray;
  }

  commitLibraryBitratesArray() {
    const s = JSON.stringify(this._libraryBitratesArray);
    this.storage.setItem('libraryBitratesArray', s);
  }

  get libraryCollapsedGroups() {
    return this._libraryCollapsedGroups;
  }

  addLibraryCollapsedGroup(key) {
    this._libraryCollapsedGroups[key] = 1;
    this.commitLibraryCollapsedGroups();
  }

  removeLibraryCollapsedGroup(key) {
    if (this._libraryCollapsedGroups[key] !== undefined) {
      delete this._libraryCollapsedGroups[key];
      this.commitLibraryCollapsedGroups();
    }
  }

  commitLibraryCollapsedGroups() {
    const s = JSON.stringify(this._libraryCollapsedGroups);
    this.storage.setItem('libraryCollapsedGroups', s);
  }

  get presetsArray() {
    return this._presetsArray;
  }

  commitPresetsArray() {
    const s = JSON.stringify(this._presetsArray);
    this.storage.setItem('presetsArray', s);
  }

  get currentRule() {
    return this._currentRule;
  }

  set currentRule(s) {
    this._currentRule = s;
    this.storage.setItem('currentRule', s);
  }

  get thresholdRule() {
    return this._thresholdRule;
  }
  
  commitThresholdRule() {
    const s = JSON.stringify(this._thresholdRule);
    this.storage.setItem('thresholdRule', s);
  }

  isThresholdRuleValid() {
    const b = (this._thresholdRule.leastMost == 'least') || (this._thresholdRule.leastMost == 'most');
    if (!b) {
      cl('bad value for leastmost');
      return false;
    }
    const multiple = parseInt(this._thresholdRule.fs);
    if (!(multiple > 0)) {
      cl('warning bad multiple');
      return false;
    }
    return true;
  }

  get abRule() {
    return this._abRule;
  }

  commitAbRule() {
    const s = JSON.stringify(this._abRule);
    this.storage.setItem('abRule', s);
  }
}

export default new Settings();