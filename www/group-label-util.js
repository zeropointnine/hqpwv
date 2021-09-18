import Settings from './settings.js';

/**
 * A group label is a collapsible header above a 'library group'.
 */
export default class GroupLabelUtil {

  /**
   * Returns a label DOM element or null
   */
  static makeLabel(label, labelClass, count=0) {

    const collapseKey = labelClass + ":" + encodeURIComponent(label.substr(0, 100));
    let s = '';
    s += `<div class="libraryGroupLabel ${labelClass}" data-collapsekey="${collapseKey}">`;
    s += `<span class="icon"></span>`;
    s += `<span class="inner">${label}</span>`;
    s += (count > 0) ? `<span class="count">(${count})</span>` : '';
    s += `<div class="iconButton moreButton"></div>`;
    s += `</div>`;

    const $label = $(s);
    $label.on('click tap', GroupLabelUtil.onClick);

    const $moreButton = $label.find('.moreButton');
    $moreButton.on('click tap', GroupLabelUtil.onContextButton);

    return $label;
  }

  static onClick = (event) => {
    // Toggle states of both the 'label' el and the 'group' el that follows it
    const $label = $(event.currentTarget);
    const $group = $label.next();
    const shouldCollapse = !$label.hasClass('isCollapsed');
    if (shouldCollapse) {
      $label.addClass('isCollapsed');
      $group.addClass('isCollapsed');
    } else {
      $label.removeClass('isCollapsed');
      $group.removeClass('isCollapsed');
    }

    // Update settings
    let key = $label.attr('data-collapsekey');
    if (key) {
      Settings.setLibraryGroupCollapsed(key, shouldCollapse);
    }
  };

  static onContextButton = (event) => {
    event.stopPropagation();
    const $button = $(event.currentTarget);
    $(document).trigger('group-label-context-button', $button);
  }
}
