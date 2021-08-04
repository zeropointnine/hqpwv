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
    Util.addAppListener(this, 'new-track-detected', this.onNewTrackDetected);
  }

  noop() { }

  onNewTrackDetected() {
    switch (Settings.currentRule) {
      case 'threshold':
        this.doThreshold();
        break;
      case 'ab':
        this.doAb();
        break;
    }
  };

  doThreshold() {
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

    this.applyPresetAndReplayTrack(preset);
  }

  /**
   * Assumes currently playing a track (presumably at the very start).
   * Shows taost at the end.
   *
   * @preset should exist and have values.
   */
  applyPresetAndReplayTrack(preset) {
    // todo block starting here maybe

    const currentTrack = Model.statusData['@_track'];
    if (!currentTrack) {
      cl('warning no track in statusdata')
    }

    PresetUtil.applyPreset(preset, (didSetSomething) => {
      if (didSetSomething) {
        // Having set a config value, hqp will be in a stopped state,
        // which means <selectTrack> will trigger a 'new-track-detected'
        // which should be ignored.
        Statuser.ignoreNextNewTrackDetected = true;

        const s = `Applied preset: <em>${PresetUtil.toString(preset)}</em>`;
        $(document).trigger('show-toast', s)
      }
      if (currentTrack) {
        Service.queueCommandFront(Commands.selectTrack(currentTrack)); // done
      }
    });
  }

  doAb() {
    this.abCounter++;
    const value = (this.abCounter % 2 == 0) ? Settings.abRule['a'] : Settings.abRule['b'];
    const preset = this.getPresetByOptionValue(value);
    if (!preset) {
      return;
    }
    this.applyPresetAndReplayTrack(preset);
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
