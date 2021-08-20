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
  isMulti = false;

  /**
   * $el is expected to have the following structure:
   *
   * <div class='dropdown'>
   *   <div class='dropdownTitle'>
   *     <div class='dropdownItems'>
   *       <div class='dropdownItem' data-value='something'>
   *       <div class='dropdownItem' data-value='something'>...
   */
  constructor($el, isMulti) {
    this.$el = $el;
    this.isMulti = isMulti;

    this.$items = $el.find('.dropdownItem');
    this.$items.on('click tap', this. onItemClick);
  }

  selectItems(arrayOfValues) {
    for (let i = 0; i < this.$items.length; i++) {
      const $item = $(this.$items[i]);
      let hit = false;
      for (const value of arrayOfValues) {
        if ($item.attr('data-value') === value) {
          hit = true;
          break;
        }
      }
      if (hit) {
        $item.addClass('isSelected');
      } else {
        $item.removeClass('isSelected');
      }
    }
  }

  show() {
    ViewUtil.setDisplayed(this.$el, true);
    // Force reflow after display:block so that css anim will trigger
    this.$el[0].offsetHeight;
    ViewUtil.setVisible(this.$el, true);
    // This class can be optionally added for anim-in effect
    this.$el.addClass('animIn');
  }

  hide() {
    this.$el.removeClass('animIn');
    ViewUtil.setVisible(this.$el, false);
    ViewUtil.setDisplayed(this.$el, false);
  }

  onItemClick = (e) => {
    if (!this.isMulti && $(e.currentTarget).hasClass('isSelected')) {
      return;
    }
    const value = $(e.currentTarget).attr('data-value');
    if (!value) {
      cl('warning dropdown item missing data-value');
      return;
    }
    // Event params are the dropdown id and `data-value` value
    $(document).trigger('dropdown-item-select', [this.$el.attr('id'), value]);
  }
}
