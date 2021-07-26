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
    this.infoView = new SettingsInfoView(this.$el.find("#settingsInfoView"));
    this.$closeButton.on('click tap', (e) => $(document).trigger('settings-view-close'));
    Util.addAppListener(this, 'model-info-updated', () => this.infoView.update());
  }

  show() {
    const $anchor = this.$el.find("#settingsProjectAnchor");
    $anchor.text(Values.PROJECT_URL);
    $anchor.attr('href', Values.PROJECT_URL);

    ViewUtil.setVisible(this.$el, true);
    this.$el[0].scrollTop = 0;
    ViewUtil.animateCss(this.$el,
        () => this.$el.css('opacity', 0),
        () => this.$el.css('opacity', 1),
        null);

    Service.queueCommandFront(Commands.getInfo());
  }
}
