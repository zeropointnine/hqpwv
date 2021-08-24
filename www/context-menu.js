import ViewUtil from './view-util.js';
import ModalPointerUtil from './modal-pointer-util.js';

/**
 * A "context menu" that pops up upon clicking a "more" button.
 */
export default class ContextMenu {

  $el;
  $items;
  ModalPointerUtil;

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
    this.ModalPointerUtil = new ModalPointerUtil(this.$el, () => this.hide());
    if (!this.$el.length || !this.$items.length) {
      cl('WARNING: ContextMenu - incorrect dom structure or properties');
    }
  }

  /**
   * Subclass should override and super.
   *
   * @param $holder is the holder which contains the button which triggers the context menu
   * @param $button
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

    this.ModalPointerUtil.start();
  }

  hide() {
    ViewUtil.setVisible(this.$el, false);
    this.ModalPointerUtil.clear();
  }

  /**
   * Subclass should override and super, and add business logic.
   * (Note how method must not be a closure to be override-able)
   */
  onItemClick(event) {
    this.hide();
  }
}
