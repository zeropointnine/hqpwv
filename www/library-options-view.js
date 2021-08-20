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
export default class LibraryOptionsView {

  $buttonsHolder = $('#libraryOptionsButtons');

  $bitrateButton = $('#libraryBitrateButton');
  bitrateDropdown = new Dropdown($('#libraryBitrateDropdown'), true);

  $sortButton = $('#librarySortButton');
  sortDropdown = new Dropdown($('#librarySortDropdown'));

  $groupButton = $('#libraryGroupButton');
  groupDropdown = new Dropdown($('#libraryGroupDropdown'));

  dropdowns = [this.sortDropdown, this.bitrateDropdown, this.groupDropdown];

  pointerUtil;

  constructor($el) {
    this.$el = $el;
    this.$sortButton.on('click tap', e => this.toggleDropdown(this.sortDropdown));
    this.$bitrateButton.on('click tap', e => this.toggleDropdown(this.bitrateDropdown));
    this.$groupButton.on('click tap', e => this.toggleDropdown(this.groupDropdown));
    $(document).on('dropdown-item-select', this.onDropdownItemSelect);
    this.pointerUtil = new ModalPointerUtil(this.$el, () => this.hideDropdowns());

    Util.addAppListener(this, 'library-view-populated', this.onLibraryViewPopulated);
  }

  toggleDropdown(dropdown) {
    ViewUtil.isDisplayed(dropdown.$el)
        ? this.hideDropdowns()
        : this.selectDropdown(dropdown);
  }

  selectDropdown(dropdown) {
    // Select corresponding button (not great)
    if (dropdown == this.bitrateDropdown) {
      this.$sortButton.removeClass('isSelected');
      this.$groupButton.removeClass('isSelected');
      this.$bitrateButton.addClass('isSelected');
    } else if (dropdown == this.sortDropdown) {
      this.$bitrateButton.removeClass('isSelected');
      this.$groupButton.removeClass('isSelected');
      this.$sortButton.addClass('isSelected');
    } else { // is gruop
      this.$bitrateButton.removeClass('isSelected');
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
        items = [Settings.librarySortType];
        break;
      case this.bitrateDropdown:
      default:
        items = Settings.libraryBitratesArray;
        break;
    }
    dropdown.selectItems(items);

    this.$buttonsHolder.addClass('isSelected');

    this.pointerUtil.start();
  }

  hideDropdowns() {
    this.$buttonsHolder.removeClass('isSelected');

    this.$sortButton.removeClass('isSelected');
    this.$bitrateButton.removeClass('isSelected');
    this.$groupButton.removeClass('isSelected');

    for (const dropdown of this.dropdowns) {
      dropdown.hide();
    }
    this.pointerUtil.clear();
  }

  onDropdownItemSelect = (e, dropdownId, value) => {
    if (dropdownId == 'librarySortDropdown') {
      this.handleSortSelect(value);
    } else if (dropdownId == 'libraryBitrateDropdown') {
      this.handleBitrateSelect(value);
    } else {
      this.handleGroupSelect(value);
    }
  };

  handleSortSelect(value) {
    this.hideDropdowns();
    Settings.librarySortType = value;
    setTimeout(() => $(document).trigger('library-settings-changed'), 16);
  }

  handleGroupSelect(value) {
    this.hideDropdowns();
    Settings.libraryGroupType = value;
    setTimeout(() => $(document).trigger('library-settings-changed'), 16);
  }

  handleBitrateSelect(value) {
    if (value == 'all') {

      Settings.libraryBitratesArray.splice(0, Settings.libraryBitratesArray.length); // ie, clear()
      Settings.libraryBitratesArray.push('all');

    } else {

      // Toggle item
      const index = Settings.libraryBitratesArray.indexOf(value);
      if (index > -1) { // remove item
        Settings.libraryBitratesArray.splice(index, 1);
      } else {
        Settings.libraryBitratesArray.push(value);
      }

      if (Settings.libraryBitratesArray.length == 0) {
        Settings.libraryBitratesArray.push('all'); // default back to 'all'
      } else {
        const indexAllItem = Settings.libraryBitratesArray.indexOf('all');
        if (indexAllItem > -1) {
          Settings.libraryBitratesArray.splice(indexAllItem, 1); // remove 'all'
        }
      }

      if (Settings.libraryBitratesArray.length == this.bitrateDropdown.$items.length - 1) {
        // must have selected all items except 'all',
        // which is tantamount to selecting 'all', so.
        Settings.libraryBitratesArray.splice(0, Settings.libraryBitratesArray.length); // ie, clear()
        Settings.libraryBitratesArray.push('all');
      }

    }
    Settings.commitLibraryBitratesArray();
    this.bitrateDropdown.selectItems(Settings.libraryBitratesArray);
    $(document).trigger('library-settings-changed');
  }

  onLibraryViewPopulated(numItems) {
    if (numItems == 0 && Model.library.albums.length > 0) {
      this.$bitrateButton.addClass('badge');
    } else {
      this.$bitrateButton.removeClass('badge');
    }
  }
}
