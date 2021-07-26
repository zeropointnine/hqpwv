/**
 * Using special <div> on the page, we can know what breakpoint
 * is currently being used.
 *
 * Width values _must_ match the div's css width values.
 */
class Breakpoint {

  $el = $('#breakpointIndicator');

  constructor() {
    if (!this.$el) {
      cl('WARNING: special element not found', this.$el);
    }
  }

  get isDesktop() {
    return (this.$el.width() == 1);
  }

  get isTablet() {
    return (this.$el.width() == 2);
  }

  get isMobile() {
    return (this.$el.width() == 3);
  }
}

export default new Breakpoint();