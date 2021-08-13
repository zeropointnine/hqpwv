import Util from './util.js';
import ViewUtil from './view-util.js';

const UNHIDE_DURATION = 400; // shd match css

/**
 *
 */
export default class TopBar {

  $el = $("#topBar");
  $appLogo = this.$el.find('#appLogo');
  $appTitle = this.$el.find('#appTitle');
  offset = 0;
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

  unhide() {
    // Must interpolate offset rather than setting css animated attribute.
    const dummyObject = { value: this.offset };
    const onUpdate = (value) => {
      this.setOffset(value)
    };
    const specs = { duration:UNHIDE_DURATION, easing: 'swing', step: onUpdate };
    $(dummyObject).animate( { value: 0.0 }, specs);
  }

  onSubviewScroll(delta) {
		// Scrolling of a subview results in the topbar moving up and down between 0 to -outerHeight.
		// As the topbar moves vertically, the remaining vertical space grows and contract accordingly.
		// Potentially expensive.

    const mult = (delta > 0) ? 0.33 : 0.66;
    const value = this.offset + (delta * mult);
    this.setOffset(value);
  }

  /**
   * Changes the y-offset (using margin-top) of the top bar upward, going off screen.
   * This causes the #mainArea to expand to fill in the remaining space.
   */
  setOffset(off) {
    this.offset = off;
    this.offset = Math.min(this.offset, this.maxOffset);
    this.offset = Math.max(this.offset, 0);

    const marginTop = Math.floor(this.offset * -1);
    this.$el.css('margin-top', marginTop + 'px');

    if (!this.hasHidden) {
      // additionally, offset applogo a little too (bc of descender of capital-Q heh)
      const top = Math.floor(this.offset * -0.33);
      this.$appLogo.css('top', top + 'px');

      if (this.offset == this.maxOffset && !this.hasHidden) {
        this.doSwap();
      }
    }
  }

  get maxOffset() {
    return this.$el.outerHeight();
  }

  doSwap() {
    this.hasHidden = true;
    ViewUtil.setDisplayed(this.$appLogo, false);
    ViewUtil.setVisible(this.$appTitle, true);
  }
}
