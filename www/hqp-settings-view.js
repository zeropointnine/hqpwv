import Subview from'./subview.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import Util from './util.js';
import Settings from'./settings.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import SettingsInfoView from './settings-info-view.js';
import HqpFiltersView from './hqp-filters-view.js';
import HqpRulesView from './hqp-rules-view.js';

/**
 * Upscaler settings view. Has nested subviews.
 */
export default class HqpSettingsView extends Subview {

  $closeButton;
  $rulesToggle;
  filtersView;
  rulesView;

  constructor() {
    super($("#hqpSettingsView"));
    this.$closeButton = this.$el.find('#hqpSettingsCloseButton');
    this.$closeButton.on('click tap', (e) => $(document).trigger('hqp-settings-view-close'));
    this.filtersView = new HqpFiltersView(this.$el.find("#hqpFiltersView"));
    this.rulesView = new HqpRulesView(this.$el.find('#hqpPresetRulesView'));

    this.$rulesToggle = this.$el.find('#settingsExperimentalLine');
    this.$rulesToggle.on('click tap', () => {
      const b = ViewUtil.isDisplayed(this.rulesView.$el);
      this.expandRules(!b);
    });
    this.expandRules(!!Settings.currentRule);
  }

  show() {
    super.show();

    ViewUtil.doStockFadeIn(this.$el);
    this.$el[0].scrollTop = 0;

    this.filtersView.onShow();
    this.rulesView.onShow();
  }

  hide() {
    super.hide();
    this.filtersView.onHide();
    this.rulesView.onHide();
  }

  expandRules(shouldExpand) {
    ViewUtil.setDisplayed(this.rulesView.$el, shouldExpand);
    if (shouldExpand) {
      this.$rulesToggle.addClass('isExpanded');
    } else {
      this.$rulesToggle.removeClass('isExpanded');
    }
  }
}
