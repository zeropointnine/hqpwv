import Util from './util.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Service from './service.js';
import ProgressView from './progress-view.js';

/**
 * Library view containing a list of albums.
 */
export default class PlaybarView {
  
  $el;
  progressView;

  playingText;
  trackCurrentSeconds;
  trackTotalSeconds;
  trackCurrentRatio = -1;
  totalTracks = -1;
  atTrack = -1;
  state = '';

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
    this.progressView = new ProgressView();

    this.$playButton.on('click tap', this.onPlayButton);
    this.$stopButton.on('click tap', () => Service.queueCommandFrontAndGetStatus(Commands.stop()));
    this.$previousButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.previous()));
    this.$nextButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.next()));
    this.$seekBackwardButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.backward()));
    this.$seekForwardButton.on("click tap", () => Service.queueCommandFrontAndGetStatus(Commands.forward()));

    this.$showPlaylistButton.on("click tap", () => $(document).trigger('playbar-show-playlist'));
    this.$playingText.on("click tap", () => $(document).trigger('playbar-show-playlist'));

    Util.addAppListener(this, 'model-status-updated', this.update);
    Util.addAppListener(this, 'model-playlist-updated', this.update);
  }

  get $el() {
  	return this.$el;
  }

  update() {
    this._updatePlayingText();
    this._updateSecondsAndThumb();
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
    const atTrack = parseInt(Model.statusData['@_track']) || 0;
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
    if (ModelUtil.isStopped()) {
      s = (Model.playlistData.length > 0)
          ? `Stopped`
          : `<span class="colorTextLess">Playlist is empty</span>`;
    } else {
      if (Model.statusData['metadata']) {
        if (Model.statusData['metadata']['@_artist']) {
          s += Model.statusData['metadata']['@_artist'];
        }
        if (Model.statusData['metadata']['@_song']) {
          if (s) {
            s += ' - ';
          }
          s += Model.statusData['metadata']['@_song'];
        }
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

  _updateSecondsAndThumb() {
    let previous = this.trackCurrentSeconds;
    this.trackCurrentSeconds = Model.getStatusTrackCurrentSeconds();
    if (this.trackCurrentSeconds != previous) {
      const seconds = (this.trackCurrentSeconds == -1) ? 0 : this.trackCurrentSeconds;
      const s = Util.durationText(seconds);
      this.$trackCurrentTime.text(s);
    }

    previous = this.trackTotalSeconds;
    this.trackTotalSeconds = Model.getStatusTrackTotalSeconds();
    if (this.trackTotalSeconds != previous) {
      const s = (this.trackTotalSeconds == -1) ? '--:--' : Util.durationText(this.trackTotalSeconds);
      this.$trackLength.text(s);
    }

    previous = this.trackCurrentRatio;
    if (this.trackCurrentSeconds == -1 || this.trackTotalSeconds <= 0) {
      this.trackCurrentRatio = 0;
    } else {
      this.trackCurrentRatio = this.trackCurrentSeconds / this.trackTotalSeconds;
      this.trackCurrentRatio = Math.max(this.trackCurrentRatio, 0);
      this.trackCurrentRatio = Math.min(this.trackCurrentRatio, 1);
    }
    if (this.trackCurrentRatio != previous) {
      this.progressView.update(this.trackCurrentRatio);
    }
  }

  onPlayButton = (e) => {
    const xml = ModelUtil.isPlaying() ? Commands.pause() : Commands.play();
    Service.queueCommandFrontAndGetStatus(xml);
  };
}
