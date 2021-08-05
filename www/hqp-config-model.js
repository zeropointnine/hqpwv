import Util from './util.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import PresetUtil from './preset-util.js';
import Commands from './commands.js';
import Service from './service.js';

/**
 * Owns hqplayer upscaling-related array data (modes, filters, shapers).
 * Plus higher-level service logic.
 */
class HqpConfigModel {

  MODE_PCM = 'PCM';
  PCM_MULTIPLE_A = 44100;
  PCM_MULTIPLE_B = 48000;

  modesArray = [];
  filtersData = {};
  shapersData = {};
  ratesData = {};
  pcmFsMultiples = [1];

  /** @returns index, which is a string */
  getModeIndex(modeName) {
    return this._lookup(this.modesArray, '@_name', modeName, '@_index');
  }

  /** @returns index, which is a string */
  getFilterIndex(modeName, filterName) {
    const a = this.filtersData[modeName];
    if (!a) {
      return null;
    }
    return this._lookup(a, '@_name', filterName, '@_index');
  }

  /** @returns index, which is a string */
  getShaperIndex(modeName, shaperName) {
    const a = this.shapersData[modeName];
    if (!a) {
      return null;
    }
    return this._lookup(a, '@_name', shaperName, '@_index');
  }

  _lookup = (array, key1, value, key2) => {
    for (let o of array ) {
      if (o[key1] == value) {
        return o[key2];
      }
    }
  };

  /**
   * Updates modes array plus filters/shapers/rates arrays (as needed).
   */
  updateData(callback) {
    this.getModes(() => this.getFiltersShapersRates(callback));
  }

  /**
   * Gets modes array (if needed) and calls back.
   */
  getModes(callback) {
    if (this.modesArray && this.modesArray.length > 0) {
      callback();
      return;
    }
    Service.queueCommandFront(Commands.getModes(), (data) => {
      const a = ModelUtil.getArrayFrom(data, 'GetModes', 'ModesItem'); // note 'ModesItem' (plural)
      // Special case: Not supporting '[source']
      for (let i = 0; i < a.length; i++) {
        if (a[i]['@_name'] === '[source]') {
          a.splice(i, 1);
          break;
        }
      }
      this.modesArray = a;
      callback();
    });
  }

  /**
   * Gets the filters, shapers, and rates arrays (if needed),
   * and calls back. Rem, these arrays are specific to the current mode.
   *
   * @param callback(isSuccess)
   */
  getFiltersShapersRates(callback) {

    const onGetFilters = (data) => {
      const a = ModelUtil.getArrayFrom(data, 'GetFilters', 'FiltersItem');
      const modeName = Model.status.data['@_active_mode'];
      this.filtersData[modeName] = a;
    };
    const onGetShapers = (data) => {
      const a = ModelUtil.getArrayFrom(data, 'GetShapers', 'ShapersItem');
      const modeName = Model.status.data['@_active_mode'];
      this.shapersData[modeName] = a;
    };
    const onGetRatesAndFinish = (data) => {
      const a = ModelUtil.getArrayFrom(data, 'GetRates', 'RatesItem');
      // Special case: Remove entry with '0'
      for (let i = 0; i < a.length; i++) {
        if (a[i]['@_rate'] === '0') {
          a.splice(i, 1);
          break;
        }
      }
      const modeName = Model.status.data['@_active_mode'];
      this.ratesData[modeName] = a;
      if (modeName == this.MODE_PCM) {
        this.initPcmFsMultiples();
      }
      $(document).trigger('upscaling-data-updated', modeName);
      callback(); // done
    };

    const step2 = () => {

      const modeName = Model.status.data['@_active_mode'];
      let b = true;
      b = b && (this.filtersData[modeName] && this.filtersData[modeName].length > 0);
      b = b && (this.shapersData[modeName] && this.shapersData[modeName].length > 0);
      b = b && (this.ratesData[modeName] && this.ratesData[modeName].length > 0);
      if (b) {
        callback(true);
        return;
      }

      Service.queueCommandsFront([
        { xml: Commands.getFilters(), callback: onGetFilters },
        { xml: Commands.getShapers(), callback: onGetShapers },
        { xml: Commands.getRates(), callback: onGetRatesAndFinish }
      ]);
    };

    // step1: Refresh status bc mode may have just been changed.
    Service.queueCommandFront(Commands.status(), step2);
  }

  /**
   * Parses pcm rates array to get 'fs' ('full scale') multiples
   * (eg, [1,2,4,8,16])
   */
  initPcmFsMultiples() {

    if (!this.ratesData || !this.ratesData[this.MODE_PCM]) {
      cl('warning no pcm rates array');
      return;
    }
    const a = this.ratesData[this.MODE_PCM];

    // Making assumption that hqp rate elements are nonrepeating and in ascending order.
    // Making hardcoded assumption about the rate multiples.
    const arrayA = [];
    const arrayB = [];
    for (let item of a) {
      const rateString = item['@_rate'];
      const rateInt = parseInt(rateString);
      if (isNaN(rateInt)) {
        cl('warning rate string doesnt parse', rateString);
        continue;
      }
      const multipleA = rateInt / this.PCM_MULTIPLE_A;
      const multipleB = rateInt / this.PCM_MULTIPLE_B;
      if (multipleA == Math.floor(multipleA)) {
        arrayA[multipleA] = true;
      } else if (multipleB == Math.floor(multipleB)) {
        arrayB[multipleB] = true;
      }
    }

    this.pcmFsMultiples = [];
    const max = Math.max(arrayA.length, arrayB.length);
    for (let i = 0; i <= max; i++) {
      if (arrayA[i] && arrayB[i]) {
        this.pcmFsMultiples.push(i);
      } else if (!arrayA[i] && !arrayB[i]) {
        // fine makes sense
      } else {
        cl('warning unexpected discrepancy', arrayA, arrayB);
      }
    }
  }
}

export default new HqpConfigModel();