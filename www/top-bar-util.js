import TopBar from './top-bar.js';
import ViewUtil from './view-util.js';

/**
 *
 */
class TopBarUtil {

  THRESHOLD = 45;

  $libraryView = $('#libraryView');
  $libraryHeader;

  $subview;
  $header;

  constructor() {
    this.$libraryView = $('#libraryView');
    this.$libraryHeader = this.$libraryView.find('.viewHeader');
  }

  setSubview($subview) {
    const $h = $subview.find('.viewHeader');
    if ($h.length == 0) {
      return;
    }
    this.$subview = $subview;
    this.$header = $h;

    TopBar.$el.append(this.$header);
    TopBar.hideButtons();
  }

  setLibrarySubviewIfNecessary() {
    const y = this.$libraryView[0].scrollTop;
    cl('a', y)
    if (y > this.THRESHOLD) {
      cl('b')
      this.setSubview(this.$libraryView);
    }
  }

  /**
   * Gives back header to its subview.
   */
  returnHeader() {
    if (!this.$header) {
      return;
    }
    this.$subview.append(this.$header);
    TopBar.showButtons();
    this.$subview = null;
    this.$header = null;
  }

  /**
   * Should be called by subviews on-scroll.
   */
  onSubviewScroll($subview) {

    const y = $subview[0].scrollTop;
    if (!this.$subview) {
      if (y > this.THRESHOLD) {
        this.setSubview($subview);
      }
    } else {
      if (y == 0) {
        this.returnHeader();
      }
    }
  }
}

export default new TopBarUtil();