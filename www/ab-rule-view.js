import Settings from './settings.js';

/**
 *
 */
export default class AbRuleView {

  $el;
  $aSelect;
  $bSelect;

  constructor($el) {
    this.$el = $el;
    this.$aSelect = $el.find('#ruleAbPresetA');
    this.$bSelect = $el.find('#ruleAbPresetB');
    this.$aSelect.on('change', this.onSelectChange);
    this.$bSelect.on('change', this.onSelectChange);
    this.applySettingsValues()
  }

  applySettingsValues() {
    this.$aSelect[0].value = Settings.abRule['a'];
    this.$bSelect[0].value = Settings.abRule['b'];
  }

  onSelectChange = () => {
    Settings.abRule['a'] = this.$aSelect[0].value;
    Settings.abRule['b'] = this.$bSelect[0].value;
    Settings.commitAbRule();
  }

  /** Returns default settings object. */
  static getDefaultValues() {
    return {
      a: '1',
      b: '2'
    };
  }

}
