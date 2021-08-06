import Values from './values.js';
import Util from './util.js';
import ViewUtil from './view-util.js';
import Commands from './commands.js';
import Settings from './settings.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import HqpConfigModel from './hqp-config-model.js';
import Native from './native.js';
import Service from './service.js';
import Statuser from './statuser.js';
import Busyer from './busyer.js';
import PresetRuleApplier from './preset-rule-applier.js';
import LibraryView from './library-view.js';
import AlbumView from './album-view.js';
import PlaylistView from './playlist-view.js';
import PlaybarView from './playbar-view.js';
import TopBar from './top-bar.js';
import SettingsView from './settings-view.js';
import HqpSettingsView from './hqp-settings-view.js';
import DialogView from './dialog-view.js';
import SnackView from './snack-view.js';
import ToastView from './toast-view.js';

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
  hqpSettingsView = new HqpSettingsView();
  subviews = [this.libraryView, this.albumView, this.playlistView, this.settingsView, this.hqpSettingsView];

  $pageHolder = $('#page');
  $settingsButton = $('#settingsButton');
  $hqpSettingsButton = $('#hqpSettingsButton');

  instanceId = Math.floor(Math.random() * 99999999);
  lastHandledKeypressTime = 0;
  resizeTimeoutId = 0;
  subviewZ = 100;

	constructor() {

    $(window).on('resize', this.onWindowResize);
    this.doWindowResize();

    Util.addAppListener(this, 'model-playlist-updated', this.updateStateClasses);
    Util.addAppListener(this, 'model-status-updated', this.updateStateClasses);
    Util.addAppListener(this, 'busy-start', this.updateBusyClass);
    Util.addAppListener(this, 'busy-end', this.updateBusyClass);
    this.updateStateClasses();

    Util.addAppListener(this, 'library-settings-changed', this.onLibrarySettingsChanged);
		Util.addAppListener(this, 'library-item-click', this.showAlbumView);
		Util.addAppListener(this, 'album-view-close-button', this.hideAlbumView);
		Util.addAppListener(this, 'playbar-show-playlist', this.onPlaybarPlaylistButton);
		Util.addAppListener(this, 'playlist-close-button', this.hidePlaylist);
		Util.addAppListener(this, 'playlist-context-album', this.playlistToAlbum);
    Util.addAppListener(this, 'settings-view-close', this.hideSettingsView);
    Util.addAppListener(this, 'hqp-settings-view-close', this.hideHqpSettingsView);
    Util.addAppListener(this, 'proxy-errors', this.showHqpDisconnectedSnack);
    Util.addAppListener(this, 'server-errors', this.showServerErrorsSnack);
    Util.addAppListener(this, 'service-response-handled', this.onServiceResponseHandled);
    Util.addAppListener(this, 'show-toast', this.showToast);

    this.$settingsButton.on("click", () => this.showSettingsView());
    this.$hqpSettingsButton.on("click", () => this.showHqpSettingsView());

    $(document).on('keydown', this.onKeydown);

    // Make the correct things visible
    for (let subview of this.subviews) {
      ViewUtil.setVisible(subview.$el, false);
    }
		this.libraryView.show();
    this.updatePageHolderSubviewClass(this.libraryView);
    ViewUtil.setVisible(this.playbarView.$el, true);

    PresetRuleApplier.noop();

    this.init();
	}

  /** Performs series of required asynchronous calls */
  init() {

    this.libraryView.setSpinnerState(true);

    // This is done in parallel to the hqp service calls
    Native.getInfo(this.instanceId, (data) => {
      Values.setImagesEndpointUsing(data.hqplayer_ip_address);
      Values.hqpwvVersion = data.hqpwv_version;
    });

    const step3 = (data) => {
      if (data.error != undefined) {
        this.showFatalError(data.error);
      }
      const duration = new Date().getTime() - startTime;
      cl(`init - async calls time ${duration}ms`);

      this.libraryView.update();
    };

    const step2 = () => {
      Statuser.start();
      Service.queueCommandsFront([
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
  
	showPlaylistView() {
    this.showSubview(this.playlistView);
		Service.queueCommandFront(Commands.playlistGet());
	}

	showAlbumView(album) {
		this.albumView.update(album);
    this.showSubview(this.albumView);
	}

	showSettingsView() {
		this.showSubview(this.settingsView);
	}

  showHqpSettingsView() {
    this.showSubview(this.hqpSettingsView);
  }

  playlistToAlbum(album) {
    ViewUtil.setVisible(this.albumView.$el, false);
    this.playlistView.hide();
    setTimeout(() => this.showAlbumView(album), 200);
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

  hideTopSubview() {
    const subview = this.getTopSubview();
    switch (subview) {
      case this.albumView:
        this.hideAlbumView();
        break;
      case this.playlistView:
        this.hidePlaylist();
        break;
      case this.settingsView:
        this.hideSettingsView();
        break;
      case this.hqpSettingsView:
        this.hideHqpSettingsView();
        break;
      default:
        if (subview) { cl('not accounted for'); }
        break;
    }
  }
  
  // ---
  // subview management

  showSubview(subview) {
    this.subviewZ++; // ha.
    subview.$el.css('z-index', this.subviewZ);
    subview.show();
    this.updatePageHolderSubviewClass(subview);
  }

  hideSubview(subview) {
    this.updatePageHolderSubviewClassOnHide();
    subview.hide();
    this.postHideFocus(subview.$el);
  }
  
  /**
   * Updates page holder css classes related to play state.
   */
  updateStateClasses() {
    // playing, paused, stopped (mutually exclusive)
    if (Model.status.isPlaying) {
      this.$pageHolder.addClass('isPlaying').removeClass('isPaused isStopped');
    } else if (Model.status.isPaused) {
      this.$pageHolder.addClass('isPaused').removeClass('isPlaying isStopped');
    } else {
      this.$pageHolder.addClass('isStopped').removeClass('isPlaying isPaused');
    }
    
    // empty playlist
    (Model.playlistData.length > 0)
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

	onPlaybarPlaylistButton() {
		if (this.playlistView.$el.css('visibility') == 'visible') {
			this.hidePlaylist();
		} else {
			this.showPlaylistView();
		}
	}

  onKeydown = (e) => {
    if (this.$pageHolder.css('pointer-events') == 'none') {
      return;
    }
    if (new Date().getTime() - this.lastHandledKeypressTime < 666) {
      // prevent issues from autorepeat or monkey-presses
      return;
    }
    switch (e.key) {
      case 'Escape':
        this.hideTopSubview();
        break;
      case 'q':
        this.playbarView.$showPlaylistButton.click();
        break;
      case 'u':
        if (!ViewUtil.isVisible(this.hqpSettingsView.$el)) {
          this.$hqpSettingsButton.click();
        }
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

  onLibrarySettingsChanged() {
    this.libraryView.update();
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

  // ---
  // modal-related
  // todo move these to dialog and snack classes

  showDialog(titleText, messageHtml, buttonText, isFatal, handler=null) {
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
    this.libraryView.setSpinnerState(false);

    let msg = `HQPWV Server can't connect to HQPlayer`;
    msg += `<br>Please make sure HQPlayer is running.`;
    msg += `<br><br><a href="${Values.TROUBLESHOOTING_HREF}" class="colorTextLess">Troubleshooting tips<a>`;
    this.showDialog('Problem', msg, 'Reload', true, e => window.location.reload());
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

  showToast(htmlText) {
    ToastView.show(htmlText)
  }
}