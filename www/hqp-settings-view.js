import Subview from'./subview.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import Util from './util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import SettingsInfoView from './settings-info-view.js';
import HqpFiltersView from './hqp-filters-view.js';

/**
 * Setting view, with image init facility and general app info.
 */
export default class HqpSettingsView extends Subview {

  $closeButton = this.$el.find('#hqpSettingsCloseButton');
  hqpFiltersView;

  constructor() {
    super($("#hqpSettingsView"));
    this.$closeButton.on('click tap', (e) => $(document).trigger('hqp-settings-view-close'));
    this.hqpFiltersView = new HqpFiltersView(this.$el.find("#hqpFiltersView"));
  }

  show() {
    super.show();

    ViewUtil.doStockFadeIn(this.$el);
    this.$el[0].scrollTop = 0;

    this.hqpFiltersView.onShow();
  }

  hide() {
    super.hide();
    this.hqpFiltersView.onHide();
  }
}
