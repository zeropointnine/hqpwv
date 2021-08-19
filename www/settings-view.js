import Subview from'./subview.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import Util from './util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import SettingsInfoView from './settings-info-view.js';
import Settings from'./settings.js';
import MetaUtil from'./meta-util.js';

/**
 * Setting view, with image init facility and general app info.
 */
export default class SettingsView extends Subview {

  $closeButton = $('#settingsCloseButton');
  $metaCheckbox;
  infoView;

  constructor() {
    super($("#settingsView"));
    this.$metaCheckbox = this.$el.find('#settingsMetaCheckbox');
    this.$closeButton.on('click tap', (e) => $(document).trigger('settings-view-close'));
    this.infoView = new SettingsInfoView(this.$el.find("#settingsInfoView"));

    this.$metaCheckbox.on('click tap', this.onMetaCheckbox);
    this.$el.find('#metaDownload').attr('href', Values.META_DOWNLOAD_LINK);

    Util.addAppListener(this, 'model-info-updated', () => this.infoView.update());
  }

  show() {
    const $version = this.$el.find('#settingsVersion');
    $version.text(`${Values.hqpwvVersion}`);
    const $anchor = this.$el.find("#settingsProjectAnchor");
    $anchor.text(Values.PROJECT_URL);
    $anchor.attr('href', Values.PROJECT_URL);

    this.updateMetaCheckbox();

    ViewUtil.doStockFadeIn(this.$el);
    this.$el[0].scrollTop = 0;

    Service.queueCommandFront(Commands.getInfo());

    $(document).trigger('enable-user-input');
  }

  hide() {
    super.hide();
    $(document).trigger('enable-user-input');
  }

  updateMetaCheckbox() {
    if (Settings.isMetaEnabled) {
      this.$metaCheckbox.addClass('isChecked');
    } else {
      this.$metaCheckbox.removeClass('isChecked');
    }
  }

  onMetaCheckbox = () => {
    Settings.isMetaEnabled = !Settings.isMetaEnabled;
    this.updateMetaCheckbox();
  }
}
