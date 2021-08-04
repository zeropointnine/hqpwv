import Settings from './settings.js';
import ThresholdRuleView from './threshold-rule-view.js';
import AbRuleView from './ab-rule-view.js';

/**
 * Preset rules section of the upscaler settings view.
 */
export default class HqpRulesView {

  $el;
  thresholdRuleView;
  abRuleView;
  
  $checkboxThreshold;
  $checkboxAb;
  checkboxes$;

  constructor($el) {
    this.$el = $el;
    this.$checkboxThreshold = this.$el.find('#ruleThresholdCheckbox');
    this.$checkboxAb = this.$el.find('#ruleAbCheckbox');
    this.checkboxes$ = [this.$checkboxThreshold, this.$checkboxAb];

    this.thresholdRuleView = new ThresholdRuleView(this.$el.find('#ruleThreshold'));
    this.abRuleView = new AbRuleView(this.$el.find('#ruleAb'));

    this.$checkboxThreshold.on('click tap', this.onCheckboxThreshold);
    this.$checkboxAb.on('click tap', this.onCheckboxAb);

    this.selectCheckboxBySettingsValue(Settings.currentRule);
  }

  onShow() { }

  onHide() { }

  onCheckboxThreshold = () => {
    const b = this.$checkboxThreshold.hasClass('isChecked');
    this.selectCheckboxById(b ? '' : 'ruleThresholdCheckbox');
  };

  onCheckboxAb = () => {
    const b = this.$checkboxAb.hasClass('isChecked');
    this.selectCheckboxById(b ? '' : 'ruleAbCheckbox');
  };
  
  selectCheckboxById(id) {
    let settingsValue = '';
    for (const $item of this.checkboxes$) {
      if ($item.attr('id') == id) {
        $item.addClass('isChecked');
        settingsValue = $item.attr('data-settings-value');
      } else {
        $item.removeClass('isChecked');
      }
    }
    Settings.currentRule = settingsValue;
  }

  selectCheckboxBySettingsValue(value) {
    for (const $item of this.checkboxes$) {
      if ($item.attr('data-settings-value') == value) {
        $item.addClass('isChecked')
      } else {
        $item.removeClass('isChecked');
      }
    }
  }
}
