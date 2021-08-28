import AlbumView from './album-view.js';
import AppUtil from './app-util.js';
import Busyer from './busyer.js';
import Commands from './commands.js';
import DialogView from './dialog-view.js';
import FullAlbumOverlay from './full-album-overlay.js';
import HqpConfigModel from './hqp-config-model.js';
import HqpSettingsView from './hqp-settings-view.js';
import LibraryView from './library-view.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import DataUtil from './data-util.js';
import Native from './native.js';
import PlaybarView from './playbar-view.js';
import PlaylistCompoundView from './playlist-compound-view.js';
import PresetRuleApplier from './preset-rule-applier.js';
import Service from './service.js';
import Settings from './settings.js';
import SettingsView from './settings-view.js';
import SnackView from './snack-view.js';
import Statuser from './statuser.js';
import ToastView from './toast-view.js';
import TopBar from './top-bar.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 * Main class.
 * Instantiation runs the app.
 * `document` must already be `ready`.
 */
export default class App {

  static instance;

  topBar = new TopBar();
	playbarView = new PlaybarView();
	libraryView = new LibraryView();
	albumView = new AlbumView();
	playlistView = new PlaylistCompoundView();
	settingsView = new SettingsView();
  hqpSettingsView = new HqpSettingsView();
  subviews = [this.libraryView, this.albumView, this.playlistView, this.settingsView, this.hqpSettingsView];

  $pageHolder = $('#page');
  $settingsButton = $('#settingsButton');
  $hqpSettingsButton = $('#hqpSettingsButton');

  instanceId = Math.floor(Math.random() * 99999999);
  lastKeyTime = 0;
  minKeyDuration = 350;
  resizeTimeoutId = 0;
  subviewZ = 100;

	constructor() {
    if (Util.isTouch) {
      $('html').addClass('isTouch');
    }
    AppUtil.updateColorTheme();
    ViewUtil.setVisible($('html'), true);

    $(window).on('resize', this.onWindowResize);
    this.doWindowResize();

    Util.addAppListener(this, 'disable-user-input', this.onDisableUserInput);
    Util.addAppListener(this, 'enable-user-input', this.onUndisableUserInput);
    Util.addAppListener(this, 'busy-start', this.updateBusyClass);
    Util.addAppListener(this, 'busy-end', this.updateBusyClass);
    Util.addAppListener(this, 'model-playlist-updated', this.updateMostStateClasses);
    Util.addAppListener(this, 'model-status-updated', this.updateMostStateClasses);
    Util.addAppListener(this, 'settings-meta-changed', this.onSettingsMetaChanged);
    Util.addAppListener(this, 'proxy-errors', this.showHqpDisconnectedSnack);
    Util.addAppListener(this, 'server-errors', this.showServerErrorsSnack);
    Util.addAppListener(this, 'service-response-handled', this.onServiceResponseHandled);

		Util.addAppListener(this, 'library-item-click', this.showAlbumView);
		Util.addAppListener(this, 'album-view-close-button', this.hideAlbumView);
		Util.addAppListener(this, 'playbar-show-playlist', this.togglePlaylistCompoundView);
		Util.addAppListener(this, 'playlist-close-button', this.hidePlaylist);
		Util.addAppListener(this, 'playlist-context-album history-context-album', this.playlistToAlbum);
    Util.addAppListener(this, 'settings-view-close', this.hideSettingsView);
    Util.addAppListener(this, 'hqp-settings-view-close', this.hideHqpSettingsView);
    Util.addAppListener(this, 'app-do-escape', this.doEscape);

    $(document).on('keydown', this.onKeydown);

    this.$settingsButton.on("click", () => this.showSettingsView());
    this.$hqpSettingsButton.on("click", () => this.showHqpSettingsView());

    App.instance = this; // yes really

    this.updateMostStateClasses();

    // Make the correct things visible
    for (let subview of this.subviews) {
      ViewUtil.setVisible(subview.$el, false);
    }
		this.libraryView.show();
    this.updatePageHolderSubviewClass(this.libraryView);
    ViewUtil.setVisible(this.playbarView.$el, true);

    PresetRuleApplier.noop();
    FullAlbumOverlay.noop();

    this.init();
	}

  /** Performs a series of required asynchronous calls. */
  init() {
    this.libraryView.setSpinnerState(true);

    // These are done in parallel to the hqp service calls
    Native.getInfo(this.instanceId, (data) => {
      Values.setValues(data);
    });
    if (Settings.isMetaEnabled) {
      MetaUtil.init();
    }

    const step3 = (data) => {
      if (data.error != undefined) {
        this.showFatalError(data.error);
        return;
      }
      const duration = new Date().getTime() - startTime;
      cl(`init - async calls ${duration}ms`);
      this.libraryView.showFirstTime();
    };

    const step2 = () => {
      Statuser.start(); // calls Status
      Service.queueCommandsFront([
        { xml: Commands.state() },
        { xml: Commands.playlistGet() },
        { xml: Commands.libraryGet(), callback: step3 }
      ])
    };

    // step1
    const startTime = new Date().getTime();
    HqpConfigModel.updateData(step2);
  };

  // ---
  // subview concrete show/hide logic
  
  togglePlaylistCompoundView() {
    if (this.getTopSubview() == this.playlistView) {
      this.hidePlaylist();
    } else {
      this.showPlaylistCompoundView();
    }
  }

  showPlaylistCompoundView() {
    this.showSubview(this.playlistView);
    Service.queueCommandFront(Commands.playlistGet());
  }

  playlistToAlbum(album) {
    ViewUtil.setVisible(this.albumView.$el, false);
    this.playlistView.hide();
    setTimeout(() => this.showAlbumView(album), 200);
  }

  showAlbumView(album, $libraryItem) {
    this.showSubview(this.albumView, album, $libraryItem);
  }

	showSettingsView() {
		this.showSubview(this.settingsView);
	}

  showHqpSettingsView() {
    this.showSubview(this.hqpSettingsView);
  }

  hidePlaylist() {
    this.hideSubview(this.playlistView);
  }

  hideAlbumView() {
    this.hideSubview(this.albumView);
  }

  hideSettingsView() {
    this.hideSubview(this.settingsView);
  }

  hideHqpSettingsView() {
    this.hideSubview(this.hqpSettingsView);
  }

  doEscape() {
    // first account for overlays, etc
    if (ViewUtil.isDisplayed(FullAlbumOverlay.$overlayScreen)) {
      FullAlbumOverlay.animateOut();
      return;
    }
    if (this.playbarView.volumePanel.isShowing) {
      this.playbarView.hideVolumePanel();
      return;
    }
    if ($(document.body).css('pointer-events') == 'none') {
      return;
    }

    const subview = this.getTopSubview();
    switch (subview) {
      case this.albumView:
        this.hideAlbumView();
        break;
      case this.playlistView:
        const result = this.playlistView.onEscape();
        if (!result) {
          this.hidePlaylist();
        }
        break;
      case this.settingsView:
        this.hideSettingsView();
        break;
      case this.hqpSettingsView:
        this.hideHqpSettingsView();
        break;
      case this.libraryView:
        this.libraryView.onEscape();
        break;
      default:
        if (subview) {
          cl('not accounted for');
        }
        break;
    }
  }
  
  // ---
  // subview management

  showSubview(subview, ...extra) {
    // Disable user input
    // Subview *must* send 'enable-user-input' at end of its show()
    $(document).trigger('disable-user-input');

    this.topBar.unhide();

    this.subviewZ++; // ha.
    subview.$el.css('z-index', this.subviewZ);
    subview.show(...extra);
    this.updatePageHolderSubviewClass(subview);
  }

  hideSubview(subview) {
    // Disable user input
    // Subview *must* send 'enable-user-input' at end of its hide()
    $(document).trigger('disable-user-input');

    this.topBar.unhide();

    this.updatePageHolderSubviewClassOnHide();
    subview.hide();
    this.postHideFocus(subview.$el);
  }
  
  /**
   * Updates page holder css classes related to play state.
   */
  updateMostStateClasses() {
    // playing, paused, stopped (mutually exclusive)
    if (Model.status.isPlaying) {
      this.$pageHolder.addClass('isPlaying').removeClass('isPaused isStopped');
    } else if (Model.status.isPaused) {
      this.$pageHolder.addClass('isPaused').removeClass('isPlaying isStopped');
    } else {
      this.$pageHolder.addClass('isStopped').removeClass('isPlaying isPaused');
    }
    
    // empty playlist
    (Model.playlist.array.length > 0)
        ? this.$pageHolder.removeClass('isPlaylistEmpty')
        : this.$pageHolder.addClass('isPlaylistEmpty');
    
    this.updateBusyClass();
  }

  updateBusyClass() {
    if (Busyer.isBusy) {
      this.$pageHolder.addClass('isBusy');
    } else {
      this.$pageHolder.removeClass('isBusy');
    }
  }

  /**
   * Updates css classes on #page which describe which subview is currently showing.
   * todo: is this still being used for any thing?!
   */
  updatePageHolderSubviewClass(subview) {
    // note how class name is that of the subview's id!
    const cls = subview.$el.attr('id');
    // trying to prevent triggering unnecessary dom changes twice here, basically
    const all = ['libraryView', 'albumView', 'playlistView', 'settingsView', 'hqpSettingsView'];
    for (let item of all) {
      if (item !== cls) {
        this.$pageHolder.removeClass(item);
      }
    }
    this.$pageHolder.addClass(cls);
  }

  /** Should be called before hiding current subview. */
  updatePageHolderSubviewClassOnHide() {
    const subviews = this.getVisibleSubviews();
    if (subviews.length < 2) {
      cl('warning not enough visible subviews');
      return;
    }
    // The subview which is about to get exposed by the current subview's hide()
    const subview = subviews[1];
    this.updatePageHolderSubviewClass(subview);
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

  /** Returns the top-most visible subview, or null. */
  getTopSubview() {
    let maxZ = 0;
    let topSubview;
    for (let subview of this.subviews) {
      if (ViewUtil.isVisible(subview.$el)) {
        const z = subview.$el.css('z-index');
        if (z > maxZ) {
          maxZ = z;
          topSubview = subview;
        }
      }
    }
    return topSubview;
  }

  /** Returns list of visible subviews in z-index order, desc. */
  getVisibleSubviews() {
    const array = [];
    for (let subview of this.subviews) {
      if (ViewUtil.isVisible(subview.$el)) {
        const z = subview.$el.css('z-index');
        array.push( { subview: subview, z: z } );
      }
    }
    array.sort((a, b) => {
      if (a.z > b.z) {
        return -1;
      } else if (a.z < b.z) {
        return 1;
      } else {
        return 0; // shdnthpn
      }
    });
    return array.map(item => item.subview );
  }

  // ---
  // handlers, various

  /**
   * When a keypress executes an action, we set a `minKeyDuration`
   * which must elapse before a new keypress will be accepted.
   * 
   */
  onKeydown = (e) => {
    const isFocusInput = $(document.activeElement).is('input');
    if (isFocusInput) {
      return;
    }
    
    // Ignore keypresses if a modal popup is up (eg context menu, etc)
    // except for the following cases:
    if ($(document.body).css('pointer-events') == 'none') {
      let isWhitelisted = false;
      switch (e.key) {
        case 'Escape':
        case '+':
        case '=':
        case '-':
          isWhitelisted = true;
          break;
      }
      if (!isWhitelisted) {
        return;
      }
    }

    const elapsed = new Date().getTime() - this.lastKeyTime;
    if (elapsed < this.minKeyDuration) {
      return;
    }

    this.lastKeyTime = new Date().getTime();

    const short = 100;
    // should match or exceed $app-standard-duration
    const long = 450;

    switch (e.key) {
      case 'Escape':
        this.doEscape();
        this.minKeyDuration = long;
        break;
      case 'q':
        this.playbarView.$showPlaylistButton.click();
        this.minKeyDuration = long;
        break;
      case 'u':
        if (!ViewUtil.isVisible(this.hqpSettingsView.$el)) {
          this.$hqpSettingsButton.click();
        } else {
          this.hideHqpSettingsView();
        }
        this.minKeyDuration = long;
        break;
      case 'f':
        if (this.getTopSubview() == this.libraryView) {
          e.preventDefault();
          this.libraryView.showSearchView();
        }
        break;
      case 's':
        this.playbarView.$stopButton.click();
        this.minKeyDuration = long;
        break;
      case 'p':
        this.playbarView.$playButton.click();
        this.minKeyDuration = long;
        break;
      case 'j':
        this.playbarView.$previousButton.click();
        this.minKeyDuration = long;
        break;
      case 'k':
        this.playbarView.$nextButton.click();
        this.minKeyDuration = long;
        break;
      case ',':
        this.playbarView.$seekBackwardButton.click();
        this.minKeyDuration = short;
        break;
      case '.':
        this.playbarView.$seekForwardButton.click();
        this.minKeyDuration = short;
        break;
      case '+':
      case '=':
        if (!ViewUtil.isVisible(this.playbarView.volumePanel.$el)) {
          this.playbarView.$volumeToggle.click()
        }
        this.playbarView.volumePanel.$plus1.click();
        this.minKeyDuration = short;
        break;
      case '-':
        if (!ViewUtil.isVisible(this.playbarView.volumePanel.$el)) {
          this.playbarView.$volumeToggle.click();
        }
        this.playbarView.volumePanel.$minus1.click();
        this.minKeyDuration = short;
        break;
    }
  };

  onSettingsMetaChanged() {
    if (Settings.isMetaEnabled && !MetaUtil.isReady && !MetaUtil.isFailed && !MetaUtil.isLoading) {
      MetaUtil.init();
    }
  }

  /** Triggers custom resize event 100ms after last window resize event. */
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

  onDisableUserInput() {
    $(document.body).css('pointer-events', 'none');
  }
  onUndisableUserInput() {
    $(document.body).css('pointer-events', '');
  }

  doWindowResize() {
    // Must set <body> height programmatically because
    // 100vh + `webkit-fill-available` fails on Mobile Firefox
    $('body').height(window.innerHeight);

    // Views should listen for this if they need to know about window-resize
    $(document).trigger('debounced-window-resize');
  }

  // ---
  // modal-related

  showFatalError(errorCode) {
    Statuser.stop();
    this.libraryView.setSpinnerState(false);

    let msg = `HQPWV Server can't connect to HQPlayer`;
    msg += `<br>Please make sure HQPlayer is running.`;
    msg += `<br><br><a href="${Values.TROUBLESHOOTING_HREF}" class="colorTextLess">Troubleshooting tips<a>`;
    DialogView.show('Problem', msg, 'Reload', true, e => window.location.reload());
  }

  showHqpDisconnectedSnack(errorCode) {
    const title = `HQPWV Server has lost connection to HQPlayer`;
    let msg = `Make sure HQPlayer is running. <span class="colorTextLess"><a href="${Values.TROUBLESHOOTING_HREF}">Troubleshooting tips<a>.</span>`;
    SnackView.show('hqp-disconnected', title, msg);
  }

  showServerErrorsSnack(statusCode) {
    const title = `HQPWV Server is not responding`;
    let msg = `Restart server if necessary. <span class="colorTextLess"><a href="${Values.TROUBLESHOOTING_HREF}">Troubleshooting tips<a>.</span>`;
    SnackView.show('server-error', title, msg);
  }
}