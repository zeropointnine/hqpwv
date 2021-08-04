import Subview from'./subview.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import Util from './util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import Settings from './settings.js';
import PresetUtil from './preset-util.js';
import SettingsInfoView from './settings-info-view.js';
import HqpFiltersView from './hqp-filters-view.js';

/**
 * 'Child' of HqpFiltersView.
 */
export default class HqpPresetsView {

  $el;
  $savePreset1;
  $savePreset2;
  $savePreset3;
  $loadPreset1;
  $loadPreset2;
  $loadPreset3;
  $loadPreset1Text;
  $loadPreset2Text;
  $loadPreset3Text;

  constructor($el) {
    this.$el = $el;
    this.$savePreset1 = this.$el.find('#savePreset1');
    this.$savePreset1.on('click tap', () => $(document).trigger('save-hqp-preset-button', 0));
    this.$savePreset2 = this.$el.find('#savePreset2');
    this.$savePreset2.on('click tap', () => $(document).trigger('save-hqp-preset-button', 1));
    this.$savePreset3 = this.$el.find('#savePreset3');
    this.$savePreset3.on('click tap', () => $(document).trigger('save-hqp-preset-button', 2));

    this.$loadPreset1 = this.$el.find('#loadPreset1');
    this.$loadPreset1.on('click tap', () => $(document).trigger('load-hqp-preset-button', 0));
    this.$loadPreset2 = this.$el.find('#loadPreset2');
    this.$loadPreset2.on('click tap', () => $(document).trigger('load-hqp-preset-button', 1));
    this.$loadPreset3 = this.$el.find('#loadPreset3');
    this.$loadPreset3.on('click tap', () => $(document).trigger('load-hqp-preset-button', 2));

    this.$loadPreset1Text = this.$el.find('#loadPreset1Text');
    this.$loadPreset2Text = this.$el.find('#loadPreset2Text');
    this.$loadPreset3Text = this.$el.find('#loadPreset3Text');
  }

  updateLoadPresetsText() {
    // todo should validate based on current info (when possible)
    const $texts = [this.$loadPreset1Text, this.$loadPreset2Text, this.$loadPreset3Text];
    for (let i = 0; i < 3; i++) {
      const $text = $texts[i];
      const o = Settings.presetsArray[i];
      const s = PresetUtil.toString(o);
      $text.text(s);
    }
  }
}
