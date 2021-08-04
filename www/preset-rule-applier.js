import Util from './util.js';
import Settings from './settings.js';
import HqpConfigModel from './hqp-config-model.js';
import PresetUtil from './preset-util.js';
import Model from './model.js';
import Commands from './commands.js';
import Service from './service.js';
import Statuser from './statuser.js';

/**
 *
 */
class PresetRuleApplier {

  abCounter = 0;

  constructor() {
    Util.addAppListener(this, 'play-to-play', this.onNewTrackDetected);
    Util.addAppListener(this, 'stop-to-play', this.onNewTrackDetected);
  }

  noop() { }

  onNewTrackDetected() {
    switch (Settings.currentRule) {
      case 'threshold':
        this.doThresholdIfNecessary();
        break;
      case 'ab':
        this.doAb();
        break;
    }
  };

  doThresholdIfNecessary() {
    if (!Settings.isThresholdRuleValid()) {
      return;
    }

    const isSourcePCM = true; // todo
    if (!isSourcePCM) {
      return;
    }

    let trackRate = 0;
    const metadata = Model.statusData['metadata'];
    if (metadata) {
      trackRate = parseInt(metadata['@_samplerate']);
    }
    if (!trackRate) {
      cl(`warning bad track samplerate info, skipping`, metadata['@_samplerate']);
      return;
    }

    const multiple = parseInt(Settings.thresholdRule.fs);
    let value;
    if (Settings.thresholdRule.leastMost == 'least') {
      const thresholdRateLower = multiple * HqpConfigModel.PCM_MULTIPLE_A;
      value = (trackRate >= thresholdRateLower)
          ? Settings.thresholdRule.presetA
          : Settings.thresholdRule.presetB;
    } else { // 'at most'
      const thresholdRateUpper = multiple * HqpConfigModel.PCM_MULTIPLE_B;
      value = (trackRate <= thresholdRateUpper)
          ? Settings.thresholdRule.presetA
          : Settings.thresholdRule.presetB;
    }
    let preset = this.getPresetByOptionValue(value);
    if (!preset) {
      cl('preset invalid, skipping');
      return;
    }

    PresetUtil.applyPresetAndPlayTrack(preset, Model.statusData['@_track']);
  }

  doAb() {
    this.abCounter++;
    const value = (this.abCounter % 2 == 0) ? Settings.abRule['a'] : Settings.abRule['b'];
    const preset = this.getPresetByOptionValue(value);
    if (!preset) {
      return;
    }
    PresetUtil.applyPresetAndPlayTrack(preset, Model.statusData['@_track']);
  }

  getPresetByOptionValue(value) {
    if (!value) {
      cl('bad value');
      return null;
    }
    let preset;
    switch (value) {
      case '1':
        preset = Settings.presetsArray[0];
        break;
      case '2':
        preset = Settings.presetsArray[1];
        break;
      case '3':
        preset = Settings.presetsArray[2];
        break;
    }
    if (!preset) {
      cl('warning no preset');
      return null;
    }
    if (!PresetUtil.doesPresetHaveValues(preset)) {
      cl('warning preset missing values', preset);
      return null;
    }
    return preset;
  }
}

export default new PresetRuleApplier()
