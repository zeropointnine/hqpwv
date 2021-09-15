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
    ViewUtil.setVisible(this.$appTitle, false);
  }

  get $el() {
  	return this.$el;
  }

  showButtons() {
    ViewUtil.setVisible(this.$appTitle, true);
    ViewUtil.setVisible(this.$topBarButtons, true);
  }

  hideButtons() {
    if (ViewUtil.isDisplayed(this.$appLogo)) {
      ViewUtil.setAnimatedCss(this.$appLogo,
          () => {
            this.$appLogo.css('z-index', 0);
            this.$appLogo.css('opacity', 0)
          },
          () => ViewUtil.setDisplayed(this.$appLogo, false));
    }
    ViewUtil.setVisible(this.$appTitle, false);
    ViewUtil.setVisible(this.$topBarButtons, false);
  }

  // used for settings view
  reshowLogo() {
    if (ViewUtil.isDisplayed(this.$appLogo)) {
      return;
    }
    ViewUtil.setVisible(this.$appTitle, false);
    ViewUtil.setDisplayed(this.$appLogo, true);
    ViewUtil.animateCss(this.$appLogo,
        () => {
          this.$appLogo.css('z-index', 9998);
          this.$appLogo.css('opacity', 0);
        },
        () => this.$appLogo.css('opacity', 1));
  }
}

export default new TopBar();
