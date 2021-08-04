import Values from './values.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Service from './service.js';
import Settings from './settings.js';
import Dropdown from './dropdown.js';

/**
 * Is a row of controls along the top of the lib view.
 * Manages the options button and one or more dropdowns
 * which the button toggles on or off.
 */
export default class LibraryOptionsView {

  $button = $('#libraryOptionsButton');
  sortDropdown = new Dropdown($('#librarySortDropdown'));

  constructor($el) {
    this.$el = $el;
    this.$button.on('click tap', e => this.toggleControls());
    $(document).on('dropdown-item-select', this.onDropdownItemSelect);
  }

  toggleControls() {
    ViewUtil.isVisible(this.sortDropdown.$el) ? this.hideControls() : this.showControls();
    // test will change as more controls are added
  }

  showControls() {
    const index = this.librarySortTypeToDropdownIndex(Settings.librarySortType);
    this.sortDropdown.selectItem(index);
    this.sortDropdown.show();

    // Tricky: Get any click on document
    setTimeout(() => $(document).on('click tap', this.onDocumentClick), 1);
    // And disable all pointer events on #page (except this view)
    $('#page').css('pointer-events', 'none');
    this.$el.css('pointer-events', 'auto');
  }

  hideControls() {
    this.sortDropdown.hide();
    // Restore things
    $(document).off('click tap', this.onDocumentClick);
    $('#page').css('pointer-events', '');
    this.$el.css('pointer-events', '');
  }

  onDropdownItemSelect = (e, dropdownId, dropdownItemIndex) => {
    if (dropdownId == 'librarySortDropdown') {
      this.hideControls();
      const value = this.librarySortTypeDropdownIndexToValue(dropdownItemIndex);
      Settings.librarySortType = value;
      $(document).trigger('library-sort-type-changed');
    }
  };

  onDocumentClick = (e) => {
    const isThis = (this.$el.has($(e.target)).length > 0);
    if (!isThis) {
      this.hideControls()
    }
  };

  librarySortTypeDropdownIndexToValue(index) {
    switch (index) {
      case 0:
        return 'artist';
      case 1:
        return 'album';
      case 2:
        return 'path';
      case 3:
        return 'random';
      default:
        return null;
    }
  }

  librarySortTypeToDropdownIndex(value) {
    switch (value) {
      case 'artist':
        return 0;
      case 'album':
        return 1;
      case 'path':
        return 2;
      case 'random':
        return 3;
      default:
        return -1;
    }
  }
}
