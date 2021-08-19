import ViewUtil from './view-util.js';

/**
 * 
 */
export default class ModealPointerUtil {

  whitelist$;
  callback;

  /**
   * @param whitelist$ jquery object or array of jquery objects that should remain clickable
   * @param callback is called when click is not on a whitelisted element 
   */
  constructor(whitelist$, callback) {
    this.whitelist$ = Array.isArray(whitelist$) ? whitelist$ : [whitelist$];
    this.callback = callback;
  }

  start() {
    setTimeout(() => $(document).on('click tap', this.onDocumentClick), 1);
    $(document).trigger('disable-user-input');
    for (const $item of this.whitelist$) {
      $item.css('pointer-events', 'auto');
    }
  }

  clear() {
    $(document).off('click tap', this.onDocumentClick);
    $(document.body).css('pointer-events', '');
    for (const $item of this.whitelist$) {
      $item.css('pointer-events', '');
    }
  }

  onDocumentClick = (e) => {
    let b = false;
    for (const $item of this.whitelist$) {
      if ($item.has($(e.target)).length > 0) {
        b = true;
        break;
      }
    }
    if (!b) {
      this.clear();
      this.callback();
    }
  };
}
