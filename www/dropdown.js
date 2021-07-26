import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Service from './service.js';

/**
 *
 */
export default class Dropdown {

  $el;
  $items;
  selectedIndex = -1;

  /**
   * $el is expected to have the following structure:
   * <div class='dropdown'>
   *   <div class='dropdownTitle'>
   *     <div class='dropdownItems>
   *       <div class='dropdownItem>
   *       <div class='dropdownItem>...
   */
  constructor($el) {
    this.$el = $el;
    this.$items = $el.find('.dropdownItem');

    this.$items.on('click tap', this. onItemClick);
  }

  selectItem(index) {
    for (let i = 0; i < this.$items.length; i++) {
      const $item = $(this.$items[i]);
      if (i == index) {
        $item.addClass('isSelected');
      } else {
        $item.removeClass('isSelected');
      }
    }
  }

  show() {
    ViewUtil.setVisible(this.$el, true);
  }

  hide() {
    ViewUtil.setVisible(this.$el, false);
  }

  onItemClick = (e) => {
    if ($(e.currentTarget).hasClass('isSelected')) {
      return;
    }
    // Note: Event params are the dropdown id and item index
    //       Handler of event must be the one to hide the dropdown, for reasons
    const index = Util.jqueryObjectIndexOf(this.$items, e.currentTarget);
    $(document).trigger('dropdown-item-select', [this.$el.attr('id'), index]);
  }
}
