import ViewUtil from './view-util.js';

/**
 * Toast-like view.
 * Child of #topBar.
 */
class ToastView {

  $el = $('#toast');
  $inner = this.$el.find('#toastInner');
  timeoutId;

  constructor() { }

  show(htmlText) {
    clearTimeout(this.timeoutId);
    this.$inner.html(htmlText);

    ViewUtil.setVisible(this.$el, true);

    ViewUtil.animateCss(this.$inner,
        () => this.$inner.css("top", this.$inner.height() + "px"),
        () => this.$inner.css('top', '0px'),
        null);

    this.timeoutId = setTimeout(() => this.hide(), 3000);
  }

  hide() {
    this.id = null;

    ViewUtil.animateCss(this.$inner,
        null,
        () => this.$inner.css("top", this.$inner.outerHeight() + "px"),
        () => ViewUtil.setVisible(this.$el, false));
  }
}

export default new ToastView();