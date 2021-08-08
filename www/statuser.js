import StatusVo from './status-vo.js';
import Util from './util.js';
import Values from './values.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Service from './service.js';
import Busyer from './busyer.js';
import MetaUtil from './meta-util.js';

const INTERVAL_FAST = 500;
const INTERVAL_PLAYING = 1000;
const INTERVAL_NOT_PLAYING = 10000;
const NEW_TRACK_TIMEOUT_DURATION = 5 * 1000;

/**
 * Makes <Status /> calls periodically, based on app state and activity.
 * Idea is to make calls more frequently while playing, otherwise less so.
 *
 * Also, logic to infer when playback has started or track has changed.
 */
class Statuser {

  /**
   * The id of the last setTimeout that was called.
   */
  timeoutId;
  ignoreNextNewTrackDetected = false;
  newTrackTimeoutId;
  
  constructor() {
    $(document).on('service-response-handled', this.onServiceResponseHandled);
  }

  start() {
    this.doNext();
  }

  stop() {
    clearTimeout(this.timeoutId);
  }

  doNext() {
    clearTimeout(this.timeoutId);
    Service.queueCommandFront(Commands.status());

    let duration;
    if (Busyer.isBusy) {
      duration = INTERVAL_FAST;
    } else {
      duration = Model.status.isPlaying ? INTERVAL_PLAYING : INTERVAL_NOT_PLAYING;
    }
    this.timeoutId = setTimeout(() => this.doNext(), duration);
  }

  onServiceResponseHandled = (e, type, data) => {

    if (type == 'Status') {
    this.detectNewTrack(data);
    } else if (type == 'Play' || type == 'SelectTrack') {
      this.doNext();
    }
  };

  /**
   * Detects if a track has either
   * 1) changed while in a playing state or
   * 2) started playing from a stopped state
   */
  detectNewTrack(data) {

    const sendEventMaybe = (name) => {
      if (this.ignoreNextNewTrackDetected) {
        // cl('statuser ignoring detect');
        this.ignoreNextNewTrackDetected = false;
      } else {
        cl(`statuser sending ${name}`);
        $(document).trigger(name);

        clearTimeout(this.newTrackTimeoutId);
        this.newTrackTimeoutId = setTimeout(this.onNewTrackTimeout, NEW_TRACK_TIMEOUT_DURATION);
      }
    };

    const isPlayToPlay = (Model.lastStatus.isPlaying && Model.status.isPlaying);
    if (isPlayToPlay) {
      const lastTrack = Model.lastStatus.trackNum;
      const currentTrack = Model.status.trackNum;
      if (lastTrack == -1 || currentTrack == -1) {
        cl('warning bad data for track');
        return;
      }
      const didTrackChange = (currentTrack != lastTrack);
      if (didTrackChange) {
        // cl('statuser detected track change');
        sendEventMaybe('play-to-play');
      }
    } else {
      const isStopToPlay = (Model.lastStatus.isStoppedExplicit && !Model.status.isStopped);
      if (isStopToPlay) {
        // cl('statuser detected stop-to-play');
        sendEventMaybe('stop-to-play');
      }
    }

    // todo take duration between samples into account?!
    // todo also, verify play @_position?
  }

  onNewTrackTimeout = () => {
    // Hopefully <Status> is up to date.
    if (Model.status.isStopped) {
      return;
    }
    if (Model.status.trackNum == -1) {
      return;
    }
    const trackIndex = Model.status.trackNum - 1;
    const playlistTrack = Model.playlistData[trackIndex];
    if (!playlistTrack) {
      cl('warning no such track (race condition?)');
      return;
    }
    const uri = playlistTrack['@_uri'];
    const hash = Model.library.uriToHashMap[uri];
    if (!hash) {
      cl('warning lookup failed');
      return;
    }

    MetaUtil.incrementNumViewsFor(hash);
    $(document).trigger('track-numviews-updated', [hash, MetaUtil.getNumViewsFor(hash)]);

    // ...
  };
}

export default new Statuser();