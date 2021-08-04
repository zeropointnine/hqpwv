import ThresholdRuleView from './threshold-rule-view.js';
import AbRuleView from './ab-rule-view.js';

/**
 * User settings, backed by local storage.
 */
class Settings {

  storage = window.localStorage;

  _librarySortType;
  _presetsArray;
  _currentRule;
  _thresholdRule;
  _abRule;

  constructor() {
    this.initFromLocalStorage();
  }

  initFromLocalStorage() {
    this._librarySortType = this.storage.getItem('librarySortType') || 'artist';

    let s = this.storage.getItem('presetsArray');
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
    cl('abrule init', this._abRule)
  }

  get librarySortType() {
    return this._librarySortType;
  }

  set librarySortType(s) {
    this._librarySortType = s;
    this.storage.setItem('librarySortType', s);
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
    cl('abrule is now', s)
  }

  isAbRuleValid() {
    cl('todo');
    return false;
  }

}

export default new Settings();