import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 *
 */
class TopBar {

  $el = $("#topBar");
  $appLogo = this.$el.find('#appLogo');
  $appTitle = this.$el.find('#appTitle');
  $topBarButtons = $('#topBarButtons');

  constructor() {
    ViewUtil.setDisplayed(this.$appLogo, false);
    ViewUtil.setDisplayed(this.$appTitle, true);
    ViewUtil.setVisible(this.$appTitle, true);
  }

  get $el() {
  	return this.$el;
  }

  showButtons() {
    ViewUtil.setDisplayed(this.$appTitle, true);
    ViewUtil.setVisible(this.$topBarButtons, true);
  }

  hideButtons() {
    ViewUtil.setDisplayed(this.$appTitle, false);
    ViewUtil.setVisible(this.$topBarButtons, false);
  }

}

export default new TopBar();
