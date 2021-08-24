import Util from './util.js';
import ViewUtil from './view-util.js';
import ModalPointerUtil from './modal-pointer-util.js';
import Model from './model.js';
import DataUtil from './data-util.js';
import Commands from './commands.js';
import Service from './service.js';
import ProgressView from './progress-view.js';
import VolumePanel from './volume-panel.js';

/**
 * Library view containing a list of albums.
 */
export default class PlaybarView {
  
  $el;
  progressView;
  volumePanel;
  pointerUtil;

  totalTracks = -1;
  atTrack = -1;
  state = '';

  playingText;
  currentSecondsText;
  totalSecondsText;
  ratio;
  isVolumePanelShowing = false;

  constructor() {
  	this.$el = $("#playbarView");

    // Rem, button states are mostly governed by css classes on root view.
    this.$playButton = this.$el.find("#playButton");
    this.$stopButton = this.$el.find("#stopButton");
    this.$previousButton = this.$el.find("#previousButton");
    this.$nextButton = this.$el.find("#nextButton");
    this.$seekBackwardButton = this.$el.find('#seekBackwardButton');
    this.$seekForwardButton = this.$el.find('#seekForwardButton');

    this.$playingText = this.$el.find("#playingText");
    this.$trackCurrentTime = this.$el.find("#playingTrackCurrentTime");
    this.$trackLength = this.$el.find("#playingTrackLength");
    this.$showPlaylistButton = this.$el.find("#showPlaylistButton");
    this.$playlistNumberAt = this.$el.find("#playlistNumberAt");
    this.$playlistNumberTotal = this.$el.find("#playlistNumberTotal");
    this.$volumeToggle = this.$el.find('#volumeToggleButton');

    this.progressView = new ProgressView();
    this.volumePanel = new VolumePanel(this.$el.find('#volumePanel'));

    this.$playButton.on('click tap', this.onPlayButton);
    this.$stopButton.on('click tap', () => Service.queueCommandFrontAndGetStatus(Commands.stop()));
    this.$previousButton.on("click tap", this.onPreviousButton);
    this.$nextButton.on("click tap", this.onNextButton);
    this.$seekBackwardButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.backward()));
    this.$seekForwardButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.forward()));

    this.$showPlaylistButton.on("click tap", () => $(document).trigger('playbar-show-playlist'));
    this.$playingText.on("click tap", () => $(document).trigger('playbar-show-playlist'));
    this.$volumeToggle.on('click tap', this.onVolumeToggle);

    Util.addAppListener(this, 'model-playlist-updated', this.onModelPlaylistUpdated);
    Util.addAppListener(this, 'model-status-updated', this.onModelStatusUpdated);
    Util.addAppListener(this, 'model-state-updated', this.onModelStateUpdated);
    Util.addAppListener(this, 'progress-thumb-drag', this.onProgressThumbDrag);


    this.pointerUtil = new ModalPointerUtil(
        [this.$volumeToggle, this.volumePanel.$el],
        () => this.hideVolumePanel());
  }

  get $el() {
  	return this.$el;
  }

  update() {
    this._updatePlayingText();
    this._updateThumb();
    this._updateCurrentSeconds();
    this._updateTotalSeconds();
    this._updatePlaylistNumbers();

    /*
    also:
    @_track_serial - ?
    @_begin_min, @_begin_sec - ints; how is this different from min/sec?
    @_queued - not sure; was 0
    */
  }

  /**
   * Updates the at-track number and total-tracks number.
   * Relies on both Model.status and Model.playlist.
   */
  _updatePlaylistNumbers() {
    // nb: status has a totaltracks property but appears to be bugged so not using
    // nb also: status.track is not correct when track is changed while in paused state.

    const totalTracks = Model.playlist.array.length;
    const atTrack = Model.playlist.currentIndex;
    if (totalTracks == this.totalTracks && atTrack == this.atTrack) {
      return;
    }
    this.totalTracks = totalTracks;
    this.atTrack = atTrack;
    this.$playlistNumberAt.text(atTrack + 1);
    this.$playlistNumberTotal.text(this.totalTracks);
  }

  /**
   * Updates the 'now playing' text line.
   * Relies on both Model.status and Model.playlist.
   */
  _updatePlayingText() {
    let s = '';
    if (Model.status.isStopped) {
      s = (Model.playlist.array.length > 0)
          ? `Stopped`
          : `<span class="colorTextLess">Playlist is empty</span>`;
    } else {
      const meta = Model.status.metadata;
      if (meta['@_artist']) {
        s += meta['@_artist'];
      }
      if (meta['@_song']) {
        if (s) {
          s += ' - ';
        }
        let song;
        if (Util.areUriAndPathEquivalent(meta['@_song'], meta['@_uri'])) {
          // hqp uses full path when file has no song metadata
          song = Util.getFilenameFromPath(meta['@_song']);
        } else {
          song = meta['@_song'];
        }
        s += song;
      }
      if (!s) {
        // can occur when 'past' playlist and about to stop
        s = '&nbsp';
      }
    }
    if (this.playingText != s) {
      this.playingText = s;
      this.$playingText.html(this.playingText);
    }
  }

  _updateThumb() {
    const seconds = (Model.status.seconds == -1) ? 0 : Model.status.seconds;
    const totalSeconds = (Model.status.totalSeconds == -1) ? 0 : Model.status.totalSeconds;
    let ratio = seconds / totalSeconds;
    if (isNaN(ratio)) {
      ratio = 0;
    }
    this.ratio = ratio;
    this.progressView.update(ratio, seconds);
  }

  _updateCurrentSeconds() {
    const seconds = (Model.status.seconds == -1) ? 0 : Model.status.seconds;
    const s = Util.durationText(seconds);
    if (this.currentSecondsText == s) {
      return;
    }
    this.currentSecondsText = s;
    this.$trackCurrentTime.text(this.currentSecondsText);
  }

  _updateTotalSeconds() {
    const seconds = (Model.status.totalSeconds == -1) ? 0 : Model.status.totalSeconds;
    const s = (seconds == -1) ? '--:--' : Util.durationText(seconds);
    if (this.totalSecondsText == s) {
      return;
    }
    this.totalSecondsText = s;
    this.$trackLength.text(this.totalSecondsText);
  }

  _updatePreviousNextButtons() {
    // rem, classes on page holder also inform disabledness as well
    if (Model.playlist.isOnFirstTrack) {
      this.$previousButton.addClass('isDisabled');
    }  else {
      this.$previousButton.removeClass('isDisabled');
    }

    const isRepeat = (Model.state.isRepeatAll || Model.state.isRepeatOne);
    if (Model.playlist.isOnLastTrack && !isRepeat) {
      this.$nextButton.addClass('isDisabled');
    }  else {
      this.$nextButton.removeClass('isDisabled');
    }
  }

  showVolumePanel() {
    if (this.isVolumePanelShowing) {
      return;
    }
    this.isVolumePanelShowing = true;
    this.$volumeToggle.addClass('isSelected');
    this.volumePanel.show();
    this.pointerUtil.start();
  }

  hideVolumePanel() {
    this.isVolumePanelShowing = false;
    this.$volumeToggle.removeClass('isSelected');
    this.volumePanel.hide();
    this.pointerUtil.clear();
  }

  onModelStatusUpdated(e) {
    this._updatePlayingText();
    if (!this.progressView.isDragging) {
      this._updateThumb();
      this._updateCurrentSeconds();
    }
    this._updateTotalSeconds();
    this._updatePlaylistNumbers();
    this._updatePreviousNextButtons();
  }

  onModelPlaylistUpdated(e) {
    this._updatePlaylistNumbers();
    this._updatePreviousNextButtons();
  }

  onModelStateUpdated(e) {
    this._updatePreviousNextButtons();
  }

  onPlayButton = (e) => {
    const xml = Model.status.isPlaying ? Commands.pause() : Commands.play();
    Service.queueCommandFrontAndGetStatus(xml);
  };

  onPreviousButton = (e) => {
    Service.queueCommandFrontAndGetStatus(Commands.previous());
  };

  onNextButton = (e) => {
    Service.queueCommandFrontAndGetStatus(Commands.next());
  };

  onProgressThumbDrag() {
    // Update current seconds text based on thumb's current position ratio
    // (during the course of the drag gesture only)
    const seconds = Model.status.getSecondsFromRatio(this.progressView.dragRatio);
    const s = Util.durationText(seconds);
    this.$trackCurrentTime.text(s);
  }

  onVolumeToggle = (e) => {
    if (!this.volumePanel.isShowing) {
      this.showVolumePanel();
    } else {
      this.hideVolumePanel();
    }
  };
}
