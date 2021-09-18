import AppUtil from './app-util.js';
import ContextMenu from './context-menu.js';
import ViewUtil from './view-util.js';

/**
 *
 */
export default class GroupLabelContextMenu extends ContextMenu {

  $expandItem;
  $collapseItem;

  constructor($el) {
    super($el);
    this.$expandItem = this.$el.find('#groupContextItemExpand');
    this.$collapseItem = this.$el.find('#groupContextItemCollapse');
  }

  show($holder, $button, areAllLabelsExpanded, areAllLabelsCollapsed) {
    super.show($holder, $button);
    ViewUtil.setDisplayed(this.$expandItem, !areAllLabelsExpanded);
    ViewUtil.setDisplayed(this.$collapseItem, !areAllLabelsCollapsed);
  }

  // override
  onItemClick(event) {
    super.onItemClick(event);
    const $item = $(event.currentTarget);
    const id = $item.attr('id');
    $(document).trigger('group-label-context-item', id);
  }
}
