import TopBarUtil from './top-bar-util.js';
import ViewUtil from './view-util.js';

/**
 * Base class for subviews of #mainView.
 * Not much at the moment.
 */
export default class Subview {

  $el;
  $list;

  constructor($el, $list=null) {
    this.$el = $el;
    this.$list = $list;
    this.$el.on("scroll", e => this.onScroll(e));
  }

  get $el() {
    return this.$el;
  }

  /**
   * Subclass should super.show()
   */
  show(...extra) {
    ViewUtil.setVisible(this.$el, true);
    ViewUtil.setFocus(this.$el);
  }

  // Override as needed
  hide() {
    ViewUtil.animateCss(this.$el,
        null,
        () => this.$el.css('opacity', 0),
        () => ViewUtil.setVisible(this.$el, false));
  }

  onScroll(e) {
    TopBarUtil.onSubviewScroll(this.$el);
  }
}
