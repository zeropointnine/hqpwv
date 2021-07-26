import Values from './values.js';
import Util from './util.js';
import ViewUtil from './view-util.js';
import Commands from './commands.js';
import Settings from './settings.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import Native from './native.js';
import Service from './service.js';
import Statuser from './statuser.js';
import LibraryView from './library-view.js';
import AlbumView from './album-view.js';
import PlaylistView from './playlist-view.js';
import PlaybarView from './playbar-view.js';
import TopBar from './top-bar.js';
import SettingsView from './settings-view.js';
import DialogView from './dialog-view.js';
import SnackView from './snack-view.js';

/**
 * 
 */
export default class App {

  topBar = new TopBar();
	playbarView = new PlaybarView();
	libraryView = new LibraryView();
	albumView = new AlbumView();
	playlistView = new PlaylistView();
	settingsView = new SettingsView();
  modals = [this.libraryView, this.albumView, this.playlistView, this.settingsView];

  $pageHolder = $('#page');
  $settingsButton = $('#settingsButton');

  lastHandledKeypressTime = 0;
  resizeTimeoutId = 0;
  subviewZ = 100;

	constructor() {
    $(window).on('resize', this.onWindowResize);
    this.doWindowResize();

    Util.addAppListener(this, 'model-library-updated', this.onModelLibraryUpdated);

    $(document).on('model-status-updated', e => this.updatePageHolderClasses());
    this.updatePageHolderClasses();

    Util.addAppListener(this, 'library-sort-type-changed', this.onLibrarySortTypeChanged);
		Util.addAppListener(this, 'library-item-click', this.showAlbumView);
		Util.addAppListener(this, 'album-view-close-button', this.hideAlbumView);
		Util.addAppListener(this, 'playbar-show-playlist', this.onPlaybarPlaylistButton);
		Util.addAppListener(this, 'playlist-close-button', this.hidePlaylist);
		Util.addAppListener(this, 'playlist-context-album', this.playlistToAlbum);
    Util.addAppListener(this, 'settings-view-close', this.hideSettingsView);
    Util.addAppListener(this, 'proxy-errors', this.showHqpDisconnectedSnack);
    Util.addAppListener(this, 'server-errors', this.showServerErrorsSnack);
    Util.addAppListener(this, 'service-response-handled', this.onServiceResponseHandled);

    this.$settingsButton.on("click", () => this.showSettingsView());

    $(document).on('keydown', this.onKeydown);

    // Make the correct things visible
    for (let modal of this.modals) {
      ViewUtil.setVisible(modal.$el, false);
    }
		this.libraryView.show();
    ViewUtil.setVisible(this.playbarView.$el, true);

		// Make service calls
    Native.getHqPlayerIpAddress((ip) => {
      Values.setImagesEndpointUsing(ip);
    });
    Statuser.start();
		Service.queueCommandsFront([
        { xml :Commands.libraryGet(), callback: this.onLibraryGetResponse },
        Commands.playlistGet()
    ]);
	}

	showPlaylistView() {
    this.showView(this.playlistView);
    this.playbarView.$showPlaylistButton.addClass('isShowing');
		Service.queueCommandFront(Commands.playlistGet());
	}

	showAlbumView(album) {
		this.albumView.update(album);
    this.showView(this.albumView);
	}

	showSettingsView() {
    ViewUtil.setVisible(this.$settingsButton, false);
		this.showView(this.settingsView);
	}

  showView(subview) {
    this.subviewZ++; // ha.
    subview.$el.css('z-index', this.subviewZ);
    subview.show();
  }

	playlistToAlbum(album) {
    ViewUtil.setVisible(this.albumView.$el, false);
		this.playlistView.hide();
    this.playbarView.$showPlaylistButton.removeClass('isShowing');
		setTimeout(() => this.showAlbumView(album), 200);
	}

  hidePlaylist() {
    this.playlistView.hide();
    this.playbarView.$showPlaylistButton.removeClass('isShowing');
    this.postHideFocus(this.playlistView.$el);
  }
  
  hideAlbumView() {
    this.albumView.hide();
    this.postHideFocus(this.albumView.$el);
  }

  hideSettingsView() {
    this.settingsView.hide();
    ViewUtil.setVisible(this.$settingsButton, true);
  }

  hideTopModal() {
    const modal = this.getTopModal();
    switch (modal) {
      case this.albumView:
        this.hideAlbumView();
        break;
      case this.playlistView:
        this.hidePlaylist();
        break;
      case this.settingsView:
        this.hideSettingsView();
        break;
      default:
        if (modal) { cl('not accounted for'); }
        break;
    }
  }

  onModelLibraryUpdated() {
    this.libraryView.update();
  }

  updatePageHolderClasses() {
    if (ModelUtil.isPlaying()) {
      this.$pageHolder.addClass('isPlaying').removeClass('isPaused isStopped');
    } else if (ModelUtil.isPaused()) {
      this.$pageHolder.addClass('isPaused').removeClass('isPlaying isStopped');
    } else {
      this.$pageHolder.addClass('isStopped').removeClass('isPlaying isPaused');
    }
  }

  /**
   * Upon hiding a view, focus on the topmost view that just got exposed.
   * (Cursor-scrolling convenience)
   */
  postHideFocus($elementWhichIsHiding) {
    const $els = [this.albumView.$el, this.playlistView.$el, this.settingsView.$el];
    let $target;
    for (let $element of $els) {
      if ($element == $elementWhichIsHiding) {
        continue;
      }
      if (ViewUtil.isVisible($element)) {
        $target = $element;
      }
    }
    if (!$target) {
      $target = this.libraryView.$el;
    }
    ViewUtil.setFocus($target);
  }

  // Returns the top-most, visible modal subview instance, or null.
  getTopModal() {
    let maxZ = 0;
    let topModal;
    for (let modal of this.modals) {
      if (ViewUtil.isVisible(modal.$el)) {
        const z = modal.$el.css('z-index');
        if (z > maxZ) {
          maxZ = z;
          topModal = modal;
        }
      }
    }
    return topModal;
  }

  onLibraryGetResponse = (data) => {
    if (data.error != undefined) {
      this.showFatalError(data.error);
    }
  };

	onPlaybarPlaylistButton() {
		if (this.playlistView.$el.css('visibility') == 'visible') {
			this.hidePlaylist();
		} else {
			this.showPlaylistView();
		}
	}

  onKeydown = (e) => {
    if (new Date().getTime() - this.lastHandledKeypressTime < 666) {
      return;
    }
    switch (e.key) {
      case 'Escape':
        this.hideTopModal();
        break;
      case 'q':
        this.playbarView.$showPlaylistButton.click();
        break;
      case 's':
        this.playbarView.$stopButton.click();
        break;
      case 'p':
        this.playbarView.$playButton.click();
        break;
      case 'j':
        this.playbarView.$previousButton.click();
        break;
      case 'k':
        this.playbarView.$nextButton.click();
        break;
      case ',':
        this.playbarView.$seekBackwardButton.click();
        break;
      case '.':
        this.playbarView.$seekForwardButton.click();
        break;
    }
  };

  onLibrarySortTypeChanged() {
    this.libraryView.update(); // hah
  }

  /** Triggers resize logic 100ms after last resize event. */
  onWindowResize = (e) => {
    clearTimeout(this.resizeTimeoutId);
    this.resizeTimeoutId = setTimeout(() => {
      this.doWindowResize();
    }, 100);
  };

  onServiceResponseHandled(type, data) {
    // Hide snackbar if issue resolved
    if (!SnackView.id) {
      return;
    }
    if (SnackView.id == 'server-error') {
      // A response by definition means that the server is back
      SnackView.hide();
    } else if (SnackView.id == 'hqp-disconnected') {
      if (!data['error']) {
        SnackView.hide();
      }
    }
  }

  doWindowResize() {
    // Must set <body> height programmatically because
    // 100vh + `webkit-fill-available` fails on Mobile Firefox
    $('body').height(window.innerHeight);

    // Views should listen for this if they need to know about window-resize
    $(document).trigger('debounced-window-resize');
  }

  showDialog(titleText, messageHtml, buttonText, isFatal, handler) {
    $(document).off('keydown', this.onKeydown);
    DialogView.show(titleText, messageHtml, buttonText, isFatal, () => {
      $(document).on('keydown', this.onKeydown);
      if (handler) {
        handler();
      }
    });
  }

  showFatalError(errorCode) {
    Statuser.stop();
    let msg = `HQPWV Server can't connect to HQPlayer`;
    msg += `<br>Please make sure HQPlayer is running.`;
    msg += `<br><br><a href="${Values.TROUBLESHOOTING_HREF}" class="colorTextLess">Troubleshooting tips<a>`;
    this.showDialog('Problem', msg, 'Reload', true, e => window.location.reload());
  }

  showHqpDisconnectedSnack(errorCode) {
    const title = `The HQPWV Server has lost connection to HQPlayer`;
    let msg = `Make sure HQPlayer is running. <span class="colorTextLess"><a href="${Values.TROUBLESHOOTING_HREF}">Troubleshooting tips<a>.</span>`;
    SnackView.show('hqp-disconnected', title, msg);
  }

  showServerErrorsSnack(statusCode) {
    const title = `The HQPWV Server is not responding`;
    let msg = `Restart HQPWV Server if necessary. <span class="colorTextLess"><a href="${Values.TROUBLESHOOTING_HREF}">Troubleshooting tips<a>.</span>`;
    SnackView.show('server-error', title, msg);
  }
}