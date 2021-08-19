import ViewUtil from './view-util.js';

const INDEFINITE_MIN_DURATION = 2500;

/**
 * Toast-like view.
 * Child of #topBar.
 */
class ToastView {

  $el = $('#toast');
  $inner = this.$el.find('#toastInner');
  timeoutId;
  indefiniteShowStart = 0;

  constructor() { }

  /**
   * @param duration 0 will make it 'indefinite'.
   */
  show(htmlText, duration=2500) {
    clearTimeout(this.timeoutId);
    this.$inner.html(htmlText);

    ViewUtil.setVisible(this.$el, true);

    ViewUtil.animateCss(this.$inner,
        () => this.$inner.css("top", this.$inner.height() + "px"),
        () => this.$inner.css('top', '0px'),
        null);

    if (duration > 0) {
      this.timeoutId = setTimeout(() => this.hide(), duration);
      this.indefiniteShowStart = 0;
    } else {
      this.indefiniteShowStart = new Date().getTime();
    }
  }

  hide() {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;

    if (this.indefiniteShowStart > 0) {
      // Force 'indefinite' toast to show for at least so long.
      const elapsed = new Date().getTime() - this.indefiniteShowStart;
      if (elapsed < INDEFINITE_MIN_DURATION - 200) {
        this.indefiniteShowStart = 0;
        const remainder = INDEFINITE_MIN_DURATION - elapsed;
        this.timeoutId = setTimeout(() => this.hide(), remainder);
        return;
      }
    }

    ViewUtil.animateCss(this.$inner,
        null,
        () => this.$inner.css("top", this.$inner.outerHeight() + "px"),
        () => ViewUtil.setVisible(this.$el, false));
  }
}

export default new ToastView();