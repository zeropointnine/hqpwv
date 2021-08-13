import Util from './util.js';
import ViewUtil from './view-util.js';
import Subview from './subview.js';
import PlaylistMainView from './playlist-main-view.js';
import HistoryView from './history-view.js';

/**
 * 'Compound view' consisting of playlist-view-proper, and history-view.
 */
export default class PlaylistView extends Subview {

  mainView;
  historyView;

  constructor() {
  	super($("#playlistView"));
    this.mainView = new PlaylistMainView(this.$el.find('#playlistMainView'));
    this.historyView = new HistoryView(this.$el.find('#historyView'));
    Util.addAppListener(this, 'playlist-history-button', this.mainToHistoryView);
    Util.addAppListener(this, 'history-close-button', this.historyToMainView);
  }

  show() {
  	super.show();

    this.$el.addClass('animIn');

  	ViewUtil.animateCss(this.$el,
  		() => this.$el.css("top", this.$el.height() + "px"),
  		() => this.$el.css('top', '0px'),
      () => {
        this.$el.removeClass('animIn');
        $(document).trigger('restore-pointer-events');
      });

    ViewUtil.setVisible(this.historyView.$el, false);
    ViewUtil.setVisible(this.mainView.$el, true);
    ViewUtil.setCssSync(this.mainView.$el, () => this.mainView.$el.css('left', '0%'));
    this.mainView.onShow();
  }

  hide() {
    ViewUtil.animateCss(this.$el,
        null,
        () => this.$el.css("top", this.$el.outerHeight() + "px"),
        () => {
          ViewUtil.setVisible(this.$el, false)
          $(document).trigger('restore-pointer-events');
        });
    this.mainView.onHide();
    this.historyView.onHide(); // for now
  }

  mainToHistoryView() {

    this.mainView.onHide();
    this.historyView.onShow();

    ViewUtil.animateCss(this.mainView.$el,
        null,
        () => this.mainView.$el.css('left', '-100%'),
        () => ViewUtil.setVisible(this.mainView.$el, false));
    ViewUtil.animateCss(this.historyView.$el,
        () => { this.historyView.$el.css('left', '100%'); ViewUtil.setVisible(this.historyView.$el, true); },
        () => this.historyView.$el.css('left', '0%'),
        () => {});
  }

  historyToMainView() {
    this.mainView.onHide();
    this.historyView.onShow();

    ViewUtil.animateCss(this.historyView.$el,
        null,
        () => this.historyView.$el.css('left', '100%'),
        () => ViewUtil.setVisible(this.historyView.$el, false));
    ViewUtil.animateCss(this.mainView.$el,
        () => { this.mainView.$el.css('left', '-100%'); ViewUtil.setVisible(this.mainView.$el, true); },
        () => this.mainView.$el.css('left', '0%'),
        () => {});
  }
}
