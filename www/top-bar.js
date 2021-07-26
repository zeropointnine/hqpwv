import Util from './util.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class TopBar {

  $el = $("#topBar");
  $appLogo = this.$el.find('#appLogo');
  $appTitle = this.$el.find('#appTitle');
  marginOffset = 0;
  hasHidden = false;

  constructor() {
    if (ViewUtil.isIOS()) {
      this.doSwap();
    } else {
      Util.addAppListener(this, 'subview-scroll', this.onSubviewScroll);
    }
  }

  get $el() {
  	return this.$el;
  }

  // todo not fully baked
  unhide() {
    this.marginOffset = 0;
    this.$el.css('margin-top', '');
  }

  // todo not fully baked
  hide() {
    const maxOffset = this.$el.outerHeight();
    this.marginOffset = maxOffset;
    this.$el.css('margin-top', (maxOffset * -1) + 'px');
  }

  onSubviewScroll(delta) {
		// Scrolling of a subview results in the topbar moving up and down between 0 to -outerHeight.
		// As the topbar moves vertically, the remaining vertical space grows and contract accordingly.
		// Potentially expensive.
    const maxOffset = this.$el.outerHeight();
    const mult = (delta > 0) ? 0.33 : 0.66;
  	this.marginOffset += delta * mult;
  	this.marginOffset = Math.min(this.marginOffset, maxOffset);
  	this.marginOffset = Math.max(this.marginOffset, 0);
    const value = Math.floor(this.marginOffset * -1);
    this.$el.css('margin-top', value + 'px');

    if (!this.hasHidden) {
      // offset applogo a little too (bc of descender of capital-Q heh)
      const value = Math.floor(this.marginOffset * -1 * 0.27);
      this.$appLogo.css('top', value + 'px');

      if (this.marginOffset == maxOffset && !this.hasHidden) {
        this.doSwap();
      }
    }
  }

  doSwap() {
    this.hasHidden = true;
    ViewUtil.setDisplayed(this.$appLogo, false);
    ViewUtil.setVisible(this.$appTitle, true);
  }
}
