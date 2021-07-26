import ViewUtil from './view-util.js';

/**
 * A "context menu" that pops up upon clicking a "more" button.
 */
export default class ContextMenu {

  $el;
  $items;

  /**
   * Element is expected to have this structure:
   *   <div class="contextMenu">
   *     <div class="contextItem>Item 1</div>
   *     <div class="contextItem>Imte 2</div> ...
   *
   * And should be sibling of view triggering it
   */
  constructor($el) {
    this.$el = $el;
    this.$items = this.$el.find('.contextItem');
    this.$items.on('click tap', e => this.onItemClick(e));

    if (!this.$el.length || !this.$el.length || !this.$items.length) {
      cl('WARNING: ContextMenu - incorrect dom structure or properties');
    }
  }

  /**
   * @param buttonX and buttonY is button position in same coord space as the $el
   * @param ...rest any data params that subclass may need to pass
   */
  show(buttonX, buttonY, ...rest) {
    // Position context menu in relation to the list item's context menu button
    const x = buttonX - this.$el.outerWidth() - 10;
    const y = buttonY;
    this.$el.css("left", x);
    this.$el.css("top", y);
    ViewUtil.setVisible(this.$el, true);

    // Tricky: Get any click on document
    setTimeout(() => $(document).on('click tap', this.onDocumentClick), 1);
    // Tricky: Disable all pointer events on #page, except the options view
    $('#page').css('pointer-events', 'none');
    this.$el.css('pointer-events', 'auto');
  }

  /**
   * Subclass should override and super.
   *
   * @param $holder is the holder which contains the button which triggers the context menu
   * @param $button is the button which triggers the context menu
   * @param rest are any other params the subclass may need (eg, some data)
   */
  show($holder, $button, ...rest) {
    // Position context menu to the left of the button that triggered it,
    // and either vertically aligned to the top or bottom of the button..
    const buttonPos = ViewUtil.getPositionInParentSpace($holder[0], $button[0]);
    let [x, y] = buttonPos;
    x = x - this.$el.width() - 10;
    if (y + this.$el.height() > $holder.height()) {
      y = y + $button.height() - this.$el.outerHeight();
    }
    this.$el.css("left", x);
    this.$el.css("top", y);
    ViewUtil.setVisible(this.$el, true);

    // Tricky: Get any click on document
    setTimeout(() => $(document).on('click tap', this.onDocumentClick), 1);
    // Tricky: Disable all pointer events on #page, except the options view
    $('#page').css('pointer-events', 'none');
    this.$el.css('pointer-events', 'auto');
  }

  hide() {
    ViewUtil.setVisible(this.$el, false);

    // Restore things
    $(document).off('click tap', this.onDocumentClick);
    $('#page').css('pointer-events', '');
    this.$el.css('pointer-events', '');
  }

  /**
   * Subclass should override and super, and add business logic.
   * (Note how method must not be a closure to be override-able)
   */
  onItemClick(event) {
    this.hide();
  }

  onDocumentClick = (e) => {
    const isThis = (this.$el.has($(e.target)).length > 0);
    if (!isThis) {
      this.hide()
    }
  };
}
