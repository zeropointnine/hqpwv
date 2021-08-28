import AppUtil from './app-util.js';
import Commands from './commands.js';
import MetaUtil from'./meta-util.js';
import Model from './model.js';
import Service from './service.js';
import Settings from'./settings.js';
import SettingsInfoView from './settings-info-view.js';
import Subview from'./subview.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 * Setting view, with image init facility and general app info.
 */
export default class SettingsView extends Subview {

  $closeButton = $('#settingsCloseButton');
  $themeDarkCheckbox;
  $themeLightCheckbox;
  $metaCheckbox;
  infoView;

  constructor() {
    super($("#settingsView"));
    this.$metaCheckbox = this.$el.find('#settingsMetaCheckbox');
    this.$themeDarkCheckbox = this.$el.find('#settingsThemeDarkCheckbox');
    this.$themeLightCheckbox = this.$el.find('#settingsThemeLightCheckbox');
    this.$closeButton.on('click tap', (e) => $(document).trigger('settings-view-close'));
    this.infoView = new SettingsInfoView(this.$el.find("#settingsInfoView"));

    this.$themeDarkCheckbox.on('click tap', this.onThemeCheckbox);
    this.$themeLightCheckbox.on('click tap', this.onThemeCheckbox);
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

    this.updateThemeCheckbox();

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

  updateThemeCheckbox() {
    if (Settings.colorTheme == 'dark') {
      this.$themeLightCheckbox.removeClass('isChecked');
      this.$themeDarkCheckbox.addClass('isChecked');
    } else {
      this.$themeDarkCheckbox.removeClass('isChecked');
      this.$themeLightCheckbox.addClass('isChecked');
    }
  }

  updateMetaCheckbox() {
    if (Settings.isMetaEnabled) {
      this.$metaCheckbox.addClass('isChecked');
    } else {
      this.$metaCheckbox.removeClass('isChecked');
    }
  }

  onThemeCheckbox = (e) => {
    Settings.colorTheme = (e.currentTarget.id == 'settingsThemeDarkCheckbox') ? 'dark' : 'light';
     this.updateThemeCheckbox();
    // And update the theme
    AppUtil.updateColorTheme();
  };

  onMetaCheckbox = () => {
    Settings.isMetaEnabled = !Settings.isMetaEnabled;
    this.updateMetaCheckbox();
  }
}
