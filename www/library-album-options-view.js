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
  $filterButton;

  sortDropdown;
  groupDropdown;
  filterDropdown;
  dropdowns;
  pointerUtil;

  constructor($el) {
    this.$el = $el;

    this.$buttonsHolder = this.$el.find('#libraryOptionsButtons');
    this.$sortButton = this.$el.find('#librarySortButton');
    this.$groupButton = this.$el.find('#libraryGroupButton');
    this.$filterButton = this.$el.find('#libraryFilterButton');

    this.sortDropdown = new Dropdown($('#librarySortDropdown'));
    this.groupDropdown = new Dropdown($('#libraryGroupDropdown'));
    this.filterDropdown = new Dropdown($('#libraryFilterDropdown'));
    this.dropdowns = [this.sortDropdown, this.groupDropdown, this.filterDropdown];

    this.pointerUtil = new ModalPointerUtil(this.$el, () => this.hideDropdowns());

    this.$sortButton.on('click tap', e => this.toggleDropdown(this.sortDropdown));
    this.$groupButton.on('click tap', e => this.toggleDropdown(this.groupDropdown));
    this.$filterButton.on('click tap', e => this.toggleDropdown(this.filterDropdown));
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
    this.$sortButton.removeClass('isSelected');
    this.$groupButton.removeClass('isSelected');
    this.$filterButton.removeClass('isSelected');
    let $button;
    switch (dropdown) {
      case this.sortDropdown:
        $button = this.$sortButton;
        break;
      case this.groupDropdown:
        $button = this.$groupButton;
        break;
      case this.filterDropdown:
        $button = this.$filterButton;
        break;
    }
    if ($button) {
      $button.addClass('isSelected');
    }

    // Show given dropdown only
    for (const item of this.dropdowns) {
      if (item != dropdown) {
        item.hide();
      }
    }
    dropdown.show();

    // Update dropdown item selection/s
    let items = [];
    switch (dropdown) {
      case this.sortDropdown:
        items = [Settings.librarySortType];
        break;
      case this.groupDropdown:
        items = [Settings.libraryGroupType];
        break;
      case this.filterDropdown:
        items = [Settings.libraryFilterType];
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
    this.$filterButton.removeClass('isSelected');

    for (const dropdown of this.dropdowns) {
      dropdown.hide();
    }
    this.pointerUtil.clear();
  }

  onDropdownItemSelect = (e, dropdownId, value) => {
    this.hideDropdowns();
    switch (dropdownId) {
      case 'librarySortDropdown':
        Settings.librarySortType = value;
        setTimeout(() => $(document).trigger('library-albums-sort-changed'), 16);
        break;
      case 'libraryGroupDropdown':
        Settings.libraryGroupType = value;
        setTimeout(() => $(document).trigger('library-albums-group-changed'), 16);
        break;
      case 'libraryFilterDropdown':
        Settings.libraryFilterType = value;
        setTimeout(() => $(document).trigger('library-albums-filter-changed'), 16);
        break;
    }
  };
}
