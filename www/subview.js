import ViewUtil from './view-util.js'

/**
 * Base class for subviews of #mainView.
 * Hooks up scroll effect. Not much else at the moment.
 */
export default class Subview {

  // Root element
  $el;
  // List container (if any)
  $list;
  // List items that are children of $list (if any)
  listItems$;
  // Used for scroll effect
  lastScrollPos = 0;

  // Define $el and $list here.
  constructor($el, $list=null) {
    this.$el = $el;
    this.$list = $list;

    this.$el.on("scroll", e => {
      const scrollPos = this.$el[0].scrollTop;
      const delta = scrollPos - this.lastScrollPos;
      this.lastScrollPos = scrollPos;
      $(document).trigger('subview-scroll', delta);
    });
  }

  get $el() {
    return this.$el;
  }

  /**
   * Subclass should super.show()
   */
  show() {
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
}
