import ViewUtil from './view-util.js';

/**
 *
 */
class DialogView {

  $outer = $('#generalDialogOuter');
  $dialog = this.$outer.find('#generalDialog');
  $title = this.$dialog.find('#generalDialogTitle');
  $message = this.$dialog.find('#generalDialogMessage');
  $button = this.$dialog.find('#generalDialogButton');

  constructor() { }

  show(titleText, messageHtmlText, buttonText, isFatalStyle, onButton) {

    $(document).trigger('disable-user-input');
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
      this.$dialog.css('pointer-events', '');
      $(document).trigger('enable-user-input');
      onButton();
    });
  }
}

export default new DialogView();