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

  show(titleText, messageHtmlText, buttonText, isFatal, onButton) {

    $('#page').css('pointer-events', 'none');
    this.$dialog.css('pointer-events', 'auto');

    isFatal
        ? this.$outer.addClass('isFatal')
        : this.$outer.removeClass('isFatal');

    this.$title.text(titleText);
    this.$message.html(messageHtmlText);
    this.$button.text(buttonText);
    ViewUtil.setVisible(this.$outer, true);

    this.$button.on('click tap', e => {
      ViewUtil.setVisible(this.$outer, false);
      $('#page').css('pointer-events', '');
      onButton();
    });
  }
}

export default new DialogView();