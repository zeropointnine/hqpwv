import ViewUtil from './view-util.js';

/**
 * Snackbar-like view.
 * Is child of #topBar.
 * Overlaps and obscures bottom of #main.
 */
class SnackView {

  $el = $('#snack');
  $inner = this.$el.find('#snackInner');
  $line1 = this.$el.find('#snackLine1');
  $line2 = this.$el.find('#snackLine2');
  $close = this.$el.find('#snackClose');

  id;

  constructor() {
    this.$close.on('click tap', () => this.hide());
  }

  show(id, titleText, messageHtmlText) {
    this.id = id;

    this.$line1.text(titleText);
    this.$line2.html(messageHtmlText);

    ViewUtil.setVisible(this.$el, true);

    ViewUtil.animateCss(this.$inner,
        () => this.$inner.css("top", this.$inner.height() + "px"),
        () => this.$inner.css('top', '0px'),
        null);
  }

  hide() {
    this.id = null;

    ViewUtil.animateCss(this.$inner,
        null,
        () => this.$inner.css("top", this.$inner.outerHeight() + "px"),
        () => ViewUtil.setVisible(this.$el, false));
  }
}

export default new SnackView();