import Util from './util.js';
import ViewUtil from './view-util.js';
import Subview from './subview.js';
import Commands from './commands.js';
import Service from './service.js';
import PlaylistMainView from './playlist-view.js';
import HistoryView from './history-view.js';
import LoadPlaylistView from './load-playlist-view.js';

/**
 * 'Compound view' consisting of playlist-view-proper, history-view, and load-playlist view.
 */
export default class PlaylistCompoundView extends Subview {

  mainView;
  historyView;
  loadView;

  constructor() {
  	super($("#playlistView"));
    this.mainView = new PlaylistMainView(this.$el.find('#playlistMainView'));
    this.historyView = new HistoryView(this.$el.find('#historyView'));
    this.loadView = new LoadPlaylistView(this.$el.find('#loadPlaylistView'));

    Util.addAppListener(this, 'playlist-history-button', this.mainToHistoryView);
    Util.addAppListener(this, 'playlist-load-button', this.mainToLoadView);

    Util.addAppListener(this, 'history-close-button', this.historyToMainView);
    Util.addAppListener(this, 'load-playlist-close', this.loadToMainView);
  }

  show() {
  	super.show();

    this.$el.addClass('animIn');

  	ViewUtil.animateCss(this.$el,
  		() => this.$el.css("top", this.$el.height() + "px"),
  		() => this.$el.css('top', '0px'),
      () => {
        this.$el.removeClass('animIn');
        $(document).trigger('enable-user-input');
      });

    ViewUtil.setVisible(this.historyView.$el, false);
    ViewUtil.setVisible(this.loadView.$el, false);
    ViewUtil.setVisible(this.mainView.$el, true);
    ViewUtil.setCssSync(this.mainView.$el, () => this.mainView.$el.css('left', '0%'));
    this.mainView.onShow();
  }

  hide() {
    if (!ViewUtil.isVisible(this.$el)) {
      return;
    }
    ViewUtil.animateCss(this.$el,
        null,
        () => this.$el.css("top", this.$el.outerHeight() + "px"),
        () => {
          ViewUtil.setVisible(this.$el, false);
          ViewUtil.setVisible(this.historyView.$el, false);
          ViewUtil.setVisible(this.loadView.$el, false);
          ViewUtil.setVisible(this.mainView.$el, false);
          $(document).trigger('enable-user-input');
        });
    this.mainView.onHide();
    this.historyView.onHide();
    this.loadView.onHide();
  }

  /** Like Android Activity.onBack() */
  onEscape() {
    if (ViewUtil.isVisible(this.historyView.$el)) {
      this.historyToMainView();
      return true;
    }
    if (ViewUtil.isVisible(this.loadView.$el)) {
      this.loadToMainView();
      return true;
    }
    // Must be main view
    if (ViewUtil.isDisplayed(this.mainView.savePanel.$el)) {
      this.mainView.savePanel.hide();
      return true;
    }
    return false;
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
    this.historyView.onHide();
    this.mainView.onShow();

    ViewUtil.animateCss(this.historyView.$el,
      null,
      () => this.historyView.$el.css('left', '100%'),
      () => {
        ViewUtil.setVisible(this.historyView.$el, false);
        this.historyView.clear();
      });

    ViewUtil.animateCss(this.mainView.$el,
      () => {
        this.mainView.$el.css('left', '-100%');
        ViewUtil.setVisible(this.mainView.$el, true); },
      () => this.mainView.$el.css('left', '0%'),
      () => {});
  }

  mainToLoadView() {
    this.mainView.onHide();
    this.loadView.onShow();

    ViewUtil.animateCss(this.mainView.$el,
        null,
        () => this.mainView.$el.css('left', '-100%'),
        () => ViewUtil.setVisible(this.mainView.$el, false));
    ViewUtil.animateCss(this.loadView.$el,
        () => { this.loadView.$el.css('left', '100%'); ViewUtil.setVisible(this.loadView.$el, true); },
        () => this.loadView.$el.css('left', '0%'),
        () => {});
  }

  loadToMainView() {
    this.loadView.onHide();
    this.mainView.onShow();

    Service.queueCommand(Commands.playlistGet());

    ViewUtil.animateCss(this.loadView.$el,
        null,
        () => this.loadView.$el.css('left', '100%'),
        () => ViewUtil.setVisible(this.loadView.$el, false));
    ViewUtil.animateCss(this.mainView.$el,
        () => { this.mainView.$el.css('left', '-100%'); ViewUtil.setVisible(this.mainView.$el, true); },
        () => this.mainView.$el.css('left', '0%'),
        () => {});
  }
}
