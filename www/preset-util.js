import Util from './util.js';
import Model from './model.js';
import HqpConfigModel from './hqp-config-model.js';
import Commands from './commands.js';
import Service from './service.js';

/**
 *
 */
class PresetUtil {

  doesPresetHaveValues(preset) {
    if (!preset) {
      cl('warning preset is null');
      return false;
    }
    const mode = preset['mode'];
    const filter = preset['filter'];
    const shaper = preset['shaper'];
    if (!mode || !filter || !shaper) {
      cl('warning preset missing a value');
      return false;
    }
    return true;
  }

   isPresetSameAsStatus(preset) {
    if (preset['mode'] !== Model.statusData['@_active_mode']) {
      return false;
    }
    if (preset['filter'] !== Model.statusData['@_active_filter']) {
      return false;
    }
    if (preset['shaper'] !== Model.statusData['@_active_shaper']) {
      return false;
    }
    return true;
  }

  /**
   * Verifies that a preset has values that are valid
   * based on the config model data that currently known.
   */
   isPresetValid(preset) {
    if (!this.doesPresetHaveValues(preset)) {
      return false;
    }
    const modeName = preset['mode'];
    let modeIndex = HqpConfigModel.getModeIndex(modeName);
    let filterIndex = HqpConfigModel.getFilterIndex(modeName, preset['filter']);
    let shaperIndex = HqpConfigModel.getShaperIndex(modeName, preset['shaper']);
    if (!modeIndex || !filterIndex || !shaperIndex) {
      cl('warning preset has value for which there is no match');
      return false;
    }
    return true;
  }

  /**
   * Applies preset values to hqp.
   * Does fetching when necessary to validate first.
   *
   * @param preset
   * @param callback(didSetSomething)
   */
  applyPreset(preset, callback) {

    if (!this.doesPresetHaveValues(preset)) {
      callback(false);
      return;
    }

    let didSetMode = false;

    const step2 = () => {
      this.applyPresetFilterShaper(preset, (didSetFS) => {
        callback(didSetMode || didSetFS);
      });
    };

    // Set mode and then get filter/shaper data as needed
    if (preset['mode'] == Model.statusData['@_active_mode']) {
      didSetMode = false;
      step2();
    } else {
      didSetMode = true;
      const modeIndex = HqpConfigModel.getModeIndex(preset['mode']);
      const xml = Commands.setMode(modeIndex);
      Service.queueCommandFront(xml, (data) => HqpConfigModel.getFiltersShapersRates(step2) );
    }
  }

  /**
   * Applies a preset's filter and shaper to hqp.
   *
   * @param preset
   * @param callback(didSetSomething)
   */
   applyPresetFilterShaper(preset, callback) {
    if (!this.isPresetValid(preset)) {
      callback(false);
      return;
    }
    if (this.isPresetSameAsStatus(preset)) {
      callback(false);
      return;
    }

    const filterIndex = HqpConfigModel.getFilterIndex(preset['mode'], preset['filter']);
    const filterXml = Commands.setFilter(filterIndex);
    const shaperIndex = HqpConfigModel.getShaperIndex(preset['mode'], preset['shaper']);
    const shapingXml = Commands.setShaping(shaperIndex);
    Service.queueCommandsFront([
      { xml: filterXml},
      { xml: shapingXml, callback: () => callback(true) } ]); // <-- done
  }

  toString(preset) {
    if (!preset) {
      return 'Not set';
    }
    const mode = preset['mode'];
    const filter = preset['filter'];
    const shaper = preset['shaper'];
    let s = Util.makeCasualDelimitedString([mode, filter, shaper], ' / ');
    if (!s) {
      return 'Not set';
    }
    return s;
  }
}

export default new PresetUtil();