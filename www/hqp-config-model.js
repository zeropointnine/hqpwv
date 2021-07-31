import Util from './util.js';
import Commands from './commands.js';
import Service from './service.js';
import ModelUtil from './model-util.js';

/**
 * Owns hqplayer configuration array data (modes, filters, shapers, rates).
 * Plus service logic.
 */
class HqpConfigModel {

  modesArray = [];
  filtersArray = [];
  shapersArray = [];
  ratesArray = [];

  /** @returns index, which is a string */
  getModeIndexUsingNameValue(nameValue) {
    return this._lookup(this.modesArray, '@_name', nameValue, '@_index');
  }

  getFilterIndexUsingNameValue(nameValue) {
    return this._lookup(this.filtersArray, '@_name', nameValue, '@_index');
  }
  getShaperIndexUsingNameValue(nameValue) {
    return this._lookup(this.shapersArray, '@_name', nameValue, '@_index');

  }
  getRateIndexUsingRateValue(rateValue) {
    return this._lookup(this.ratesArray, '@_rate', rateValue, '@_index');
  }

  updateData(callback) {
    Service.queueCommandsFront([
      { xml: Commands.getModes(), callback: this.onGetModes},
      { xml: Commands.getFilters(), callback: this.onGetFilters },
      { xml: Commands.getShapers(), callback: this.onGetShapers },
      { xml: Commands.getRates(), callback: this.onGetRates },
      { xml: Commands.status(), callback: callback }
    ]);
  }
  onGetModes = (data) => {
    this.modesArray = ModelUtil.getArrayFrom(data, 'GetModes', 'ModesItem'); // note 'ModesItem' (plural)
  };
  onGetFilters = (data) => {
    this.filtersArray = ModelUtil.getArrayFrom(data, 'GetFilters', 'FiltersItem');
  };
  onGetShapers = (data) => {
    this.shapersArray = ModelUtil.getArrayFrom(data, 'GetShapers', 'ShapersItem');
  };
  onGetRates = (data) => {
    this.ratesArray = ModelUtil.getArrayFrom(data, 'GetRates', 'RatesItem');
    if (this.ratesArray[0]['@_rate'] == '0') { // special case
      this.ratesArray.shift();
    }
  };

  /**
   * Applies preset values to hqp. Very much asynchronous.
   * @param preset
   * @param callback(isSuccess)
   */
  applyPreset(preset, callback) {

    if (!this.doesPresetHaveValues(preset)) {
      callback(false);
      return;
    }

    const step3 = () => {
      if (!this.isPresetValid(preset)) {
        callback(false);
        return;
      }
      let filterIndex = this.getFilterIndexUsingNameValue(preset['filter']);
      let shaperIndex = this.getShaperIndexUsingNameValue(preset['shaper']);
      let rateIndex = this.getRateIndexUsingRateValue(preset['rate']);
      const a = [
        Commands.setFilter(filterIndex),
        Commands.setShaping(shaperIndex),
        { xml: Commands.setRate(rateIndex), callback: () => callback(true) }
      ];
      Service.queueCommandsFront(a);
    };
    const step2 = () => {
      this.updateData(step3);
    };

    // todo promises
    // 1. Set mode
    // 2. Update the data arrays
    // 3. Set filter/shaper/rate
    // 4. Call back
    let modeIndex = this.getModeIndexUsingNameValue(preset['mode']);
    Service.queueCommandFront(Commands.setMode(modeIndex), step2);
  }

  /** Verifies preset has values. */
  doesPresetHaveValues(preset) {
    if (!preset) {
      cl('warning preset is null');
      return false;
    }
    const mode = preset['mode'];
    const filter = preset['filter'];
    const shaper = preset['shaper'];
    const rate = preset['rate'];
    if (!mode || !filter || !shaper || !rate) {
      cl('warning preset missing a value');
      return false;
    }
    return true;
  }

  /**
   * Verifies that a preset has values that are valid for the current config model data.
   * Rem, filter/shaper/rate arrays are dependent on the currently set mode.
   */
  isPresetValid(preset) {
    if (!this.doesPresetHaveValues(preset)) {
      return false;
    }
    let modeIndex = this.getModeIndexUsingNameValue(preset['mode']);
    let filterIndex = this.getFilterIndexUsingNameValue(preset['filter']);
    let shaperIndex = this.getShaperIndexUsingNameValue(preset['shaper']);
    let rateIndex = this.getRateIndexUsingRateValue(preset['rate']);
    if (!modeIndex || !filterIndex || !shaperIndex || !rateIndex) {
      cl('warning preset has value which has no match for current data');
      return false;
    }
    return true;
  }

  _lookup = (array, key1, value, key2) => {
    for (let o of array ) {
      if (o[key1] == value) {
        return o[key2];
      }
    }
  };
}

export default new HqpConfigModel();