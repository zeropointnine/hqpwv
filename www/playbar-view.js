import Util from './util.js';
import ViewUtil from './view-util.js';
import ModalPointerUtil from './modal-pointer-util.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
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
    this.$previousButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.previous()));
    this.$nextButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.next()));
    this.$seekBackwardButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.backward()));
    this.$seekForwardButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.forward()));

    this.$showPlaylistButton.on("click tap", () => $(document).trigger('playbar-show-playlist'));
    this.$playingText.on("click tap", () => $(document).trigger('playbar-show-playlist'));
    this.$volumeToggle.on('click tap', this.onVolumeToggle);

    Util.addAppListener(this, 'model-status-updated', this.onModelStatusUpdated);
    Util.addAppListener(this, 'model-playlist-updated', this.onModelPlaylistUpdated);
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
   * Uses data from both Model.status and Model.playlist.
   */
  _updatePlaylistNumbers() {
    // nb: status has a totaltracks property but appears to be bugged so not using
    const totalTracks = parseInt(Model.playlistData.length) || 0;
    const atTrack = parseInt(Model.status.data['@_track']) || 0;
    if (totalTracks == this.totalTracks && atTrack == this.atTrack) {
      return;
    }
    this.totalTracks = totalTracks;
    this.atTrack = atTrack;

    this.$playlistNumberAt.text(this.atTrack);
    this.$playlistNumberTotal.text(this.totalTracks);
  }

  /**
   * Updates the 'now playing' text line.
   * Uses data from both Model.status and Model.playlist.
   */
  _updatePlayingText() {
    let s = '';
    if (Model.status.isStopped) {
      s = (Model.playlistData.length > 0)
          ? `Stopped`
          : `<span class="colorTextLess">Playlist is empty</span>`;
    } else {
      if (Model.status.metadata['@_artist']) {
        s += Model.status.metadata['@_artist'];
      }
      if (Model.status.metadata['@_song']) {
        if (s) {
          s += ' - ';
        }
        s += Model.status.metadata['@_song'];
      }
      if (!s) {
        s = '---'; // stopped?
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
    if (ratio == this.ratio) {
      return;
    }
    this.ratio = ratio;
    this.progressView.update(this.ratio);
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
  }

  onModelPlaylistUpdated(e) {
    this._updatePlaylistNumbers();
  }

  onPlayButton = (e) => {
    const xml = Model.status.isPlaying ? Commands.pause() : Commands.play();
    Service.queueCommandFrontAndGetStatus(xml);
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
