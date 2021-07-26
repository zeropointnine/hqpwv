/**
 * Displays app info.
 */
import Model from './model.js';

export default class SettingsInfoView {

  $el;
  $hqpVersion;

  constructor($el) {
    this.$el = $el;
    this.$hqpVersion = this.$el.find("#hqpVersion");
  }

  update() {
    const product = Model.infoData['@_product'];
    const platform = Model.infoData['@_platform'];
    const version = Model.infoData['@_version'];
    let s = '';
    if (product) {
      s = product;
    }
    if (platform) {
      s = s ? (s + ' / ' + platform) : '';
    }
    if (version) {
      const s2 = version ? ('<br>Version code: ' + version) : '';
      if (s2) {
        s = s ? (s + s2) : s;
      }
    }
    this.$hqpVersion.html(s);
  }
}
