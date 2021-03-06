import ThresholdRuleView from './threshold-rule-view.js';
import AbRuleView from './ab-rule-view.js';

/**
 * User settings, backed by local storage.
 */
class Settings {

  storage = window.localStorage; // todo handle disabledness

  _metaEnabled;
  _librarySearchType;
  _librarySearchValue;
  _librarySortType;
  _libraryGroupType;
  _libraryFilterType;
  _libraryCollapsedGroups;
  _colorTheme;
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

    this._librarySearchType = this.storage.getItem('librarySearchType') || 'album';

    this._librarySearchValue = this.storage.getItem('librarySearchValue') || '';

    this._librarySortType = this.storage.getItem('librarySortType') || 'artist';
    this._libraryGroupType = this.storage.getItem('libraryGroupType') || 'none';
    this._libraryFilterType = this.storage.getItem('libraryFilterType') || 'none';

    s = this.storage.getItem('libraryCollapsedGroups');
    try {
      this._libraryCollapsedGroups = JSON.parse(s) || {};
    } catch (exc) {
      cl('warning', s, exc);
      this._libraryCollapsedGroups = {};
    }

    this._colorTheme = this.storage.getItem('colorTheme') || 'dark';

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

  get librarySortType() {
    return this._librarySortType;
  }

  set librarySortType(s) {
    this._librarySortType = s;
    this.storage.setItem('librarySortType', s);
  }

  get libraryGroupType() {
    return this._libraryGroupType;
  }

  set libraryGroupType(s) {
    this._libraryGroupType = s;
    this.storage.setItem('libraryGroupType', s);
  }

  get libraryFilterType() {
    return this._libraryFilterType;
  }

  set libraryFilterType(s) {
    this._libraryFilterType = s;
    this.storage.setItem('libraryFilterType', s);
  }

  // ---

  isLibraryGroupCollapsed(key) {
    return !!this._libraryCollapsedGroups[key]
  }

  setLibraryGroupCollapsed(key, isCollapsed) {
    if (isCollapsed) {
      this._libraryCollapsedGroups[key] = 1;
      this._commitLibraryCollapsedGroups();
    } else {
      if (this._libraryCollapsedGroups[key] !== undefined) {
        delete this._libraryCollapsedGroups[key];
        this._commitLibraryCollapsedGroups();
      }
    }
  }

  /* Batch update */
  setLibraryGroupsCollapsed(keys, isCollapsed) {
    if (isCollapsed) {
      for (const key of keys) {
        this._libraryCollapsedGroups[key] = 1;
      }
    } else {
      for (const key of keys) {
        delete this._libraryCollapsedGroups[key];
      }
    }
    this._commitLibraryCollapsedGroups();
  }

  _commitLibraryCollapsedGroups() {
    const s = JSON.stringify(this._libraryCollapsedGroups);
    this.storage.setItem('libraryCollapsedGroups', s);
  }

  // ---

  get colorTheme() {
    return this._colorTheme;
  }

  set colorTheme(s) {
    this._colorTheme = s;
    this.storage.setItem('colorTheme', s);
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