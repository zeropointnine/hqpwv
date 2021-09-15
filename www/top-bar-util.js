import TopBar from './top-bar.js';
import ViewUtil from './view-util.js';

/**
 *
 */
class TopBarUtil {

  VIEW_HEADER_HEIGHT = 52; // must match scss $view-header-height
  THRESHOLD;

  $libraryView = $('#libraryView');
  $libraryHeader;

  $subview;
  $header;

  constructor() {
    this.THRESHOLD = this.VIEW_HEADER_HEIGHT * 0.5;
    this.$libraryView = $('#libraryView');
    this.$libraryHeader = this.$libraryView.find('.viewHeader');
  }

  /**
   *
   */
  takeSubviewHeader($subview, now) {
    const $h = $subview.find('.viewHeader');
    if ($h.length == 0) {
      return;
    }
    this.$subview = $subview;
    this.$header = $h;

    TopBar.hideButtons();

    TopBar.$el.append(this.$header);

    if (now) {
      ViewUtil.setCssPropertySync(this.$header, 'top', 0);
    } else {
      ViewUtil.animateCss(this.$header,
          () => { this.$header.css('top', (this.VIEW_HEADER_HEIGHT - 8)) },
          () => { this.$header.css('top', 0)},
          () => {});
    }
  }

  /**
   * Gives back header to its subview.
   */
  returnSubviewHeader(now) {
    if (!this.$header) {
      return;
    }

    TopBar.showButtons();

    this.$subview.append(this.$header);

    if (now) {
      ViewUtil.setCssPropertySync(this.$header, 'top', 0);
    } else {
      ViewUtil.animateCss(this.$header,
          () => { this.$header.css('top', -(this.VIEW_HEADER_HEIGHT - 16)) },
          () => { this.$header.css('top', 0)},
          () => {});
    }

    this.$subview = null;
    this.$header = null;
  }

  /**
   * Should be called when transitioning forward or backward between subviews.
   *
   * @param $subview is the subview which is or is-about-to-be exposed via either an anim-in or out.
   */
  updateFor($subview, now) {
    const y = $subview[0].scrollTop;
    if (!this.$subview) {
      if (y > this.THRESHOLD) {
        this.takeSubviewHeader($subview, now);
      }
    } else { // has subview
      if (y == 0) {
        this.returnSubviewHeader(now);
      }
    }
  }

  /**
   * Should be called by subviews on-scroll.
   */
  onSubviewScroll($subview) {
    this.updateFor($subview);
  }
}

export default new TopBarUtil();