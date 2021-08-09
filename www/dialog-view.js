import ViewUtil from './view-util.js';

/**
 *
 */
class DialogView {

  $outer = $('#dialogOuter');
  $dialog = this.$outer.find('#dialog');
  $title = this.$dialog.find('#dialogTitle');
  $message = this.$dialog.find('#dialogMessage');
  $button = this.$dialog.find('#dialogButton');

  constructor() { }

  show(titleText, messageHtmlText, buttonText, isFatalStyle, onButton) {

    $(document.body).css('pointer-events', 'none');
    this.$dialog.css('pointer-events', 'auto');

    isFatalStyle
        ? this.$outer.addClass('isFatal')
        : this.$outer.removeClass('isFatal');

    this.$title.text(titleText);
    this.$message.html(messageHtmlText);
    this.$button.text(buttonText);
    ViewUtil.setVisible(this.$outer, true);

    this.$button.on('click tap', e => {
      ViewUtil.setVisible(this.$outer, false);
      $(document.body).css('pointer-events', '');
      this.$dialog.css('pointer-events', '');
      onButton();
    });
  }
}

export default new DialogView();