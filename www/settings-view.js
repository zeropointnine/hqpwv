import Subview from'./subview.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import Util from './util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import SettingsInfoView from './settings-info-view.js';

/**
 * Setting view, with image init facility and general app info.
 */
export default class SettingsView extends Subview {

  $closeButton = $('#settingsCloseButton');
  infoView;

  constructor() {
    super($("#settingsView"));
    this.$closeButton.on('click tap', (e) => $(document).trigger('settings-view-close'));
    this.infoView = new SettingsInfoView(this.$el.find("#settingsInfoView"));

    Util.addAppListener(this, 'model-info-updated', () => this.infoView.update());
  }

  show() {
    const $version = this.$el.find('#settingsVersion');
    $version.text(`HQPWV ${Values.hqpwvVersion}`);
    const $anchor = this.$el.find("#settingsProjectAnchor");
    $anchor.text(Values.PROJECT_URL);
    $anchor.attr('href', Values.PROJECT_URL);

    ViewUtil.doStockFadeIn(this.$el);
    this.$el[0].scrollTop = 0;

    Service.queueCommandFront(Commands.getInfo());
  }
}
