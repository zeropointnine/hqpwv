import Values from './values.js';
import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Service from './service.js';
import Settings from './settings.js';
import Dropdown from './dropdown.js';
import ModalPointerUtil from './modal-pointer-util.js';

/**
 * Row of controls along the top of the lib view.
 * Manages dropdown toggle buttons and their dropdowns.
 */
export default class LibraryAlbumOptionsView {

  $el;
  $buttonsHolder;
  $sortButton;
  $groupButton;

  sortDropdown;
  groupDropdown;
  dropdowns;
  pointerUtil;

  constructor($el) {
    this.$el = $el;

    this.$buttonsHolder = this.$el.find('#libraryOptionsButtons');
    this.$sortButton = this.$el.find('#librarySortButton');
    this.$groupButton = this.$el.find('#libraryGroupButton');

    this.sortDropdown = new Dropdown($('#librarySortDropdown'));
    this.groupDropdown = new Dropdown($('#libraryGroupDropdown'));
    this.dropdowns = [this.sortDropdown, this.groupDropdown];

    this.pointerUtil = new ModalPointerUtil(this.$el, () => this.hideDropdowns());

    this.$sortButton.on('click tap', e => this.toggleDropdown(this.sortDropdown));
    this.$groupButton.on('click tap', e => this.toggleDropdown(this.groupDropdown));
    $(document).on('dropdown-item-select', this.onDropdownItemSelect);
  }

  show() {
    ViewUtil.setDisplayed(this.$el, "flex");
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
  }

  toggleDropdown(dropdown) {
    ViewUtil.isDisplayed(dropdown.$el)
        ? this.hideDropdowns()
        : this.selectDropdown(dropdown);
  }

  selectDropdown(dropdown) {
    // Select corresponding button
    if (dropdown == this.sortDropdown) {
      this.$groupButton.removeClass('isSelected');
      this.$sortButton.addClass('isSelected');
    } else { // is gruop
      this.$sortButton.removeClass('isSelected');
      this.$groupButton.addClass('isSelected');
    }

    // Show given dropdown only
    for (const item of this.dropdowns) {
      if (item != dropdown) {
        item.hide();
      }
    }
    dropdown.show();

    // Update dropdown item selection/s
    let items;
    switch (dropdown) {
      case this.groupDropdown:
        items = [Settings.libraryGroupType];
        break;
      case this.sortDropdown:
      default:
        items = [Settings.librarySortType];
        break;
    }
    dropdown.selectItems(items);

    this.$buttonsHolder.addClass('isSelected');

    this.pointerUtil.start();
  }

  hideDropdowns() {
    this.$buttonsHolder.removeClass('isSelected');
    this.$sortButton.removeClass('isSelected');
    this.$groupButton.removeClass('isSelected');

    for (const dropdown of this.dropdowns) {
      dropdown.hide();
    }
    this.pointerUtil.clear();
  }

  onDropdownItemSelect = (e, dropdownId, value) => {
    if (dropdownId == 'librarySortDropdown') {
      this.handleSortSelect(value);
    } else {
      this.handleGroupSelect(value);
    }
  };

  handleSortSelect(value) {
    this.hideDropdowns();
    Settings.librarySortType = value;
    setTimeout(() => $(document).trigger('library-albums-sort-changed'), 16);
  }

  handleGroupSelect(value) {
    this.hideDropdowns();
    Settings.libraryGroupType = value;
    setTimeout(() => $(document).trigger('library-albums-group-changed'), 16);
  }
}
