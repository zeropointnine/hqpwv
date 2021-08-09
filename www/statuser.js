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
const VIEW_DETECT_DURATION_MS = 5 * 1000;

/**
 * Makes <Status /> calls periodically, based on app state and activity.
 * Idea is to make calls more frequently while playing, otherwise less so.
 *
 * Also, new-track logic plus view-detect logic.
 */
class Statuser {

  /**
   * The id of the last setTimeout that was called.
   */
  timeoutId;

  ignoreNextNewTrackDetected = false;

  viewDetectUri;
  viewDetectPastZeroStartTime;
  viewDetectHasTriggered;

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
      // Had to simplify this :/
      duration = !Model.status.isStopped ? INTERVAL_PLAYING : INTERVAL_NOT_PLAYING;
    }
    this.timeoutId = setTimeout(() => this.doNext(), duration);
  }

  onServiceResponseHandled = (e, type, data) => {
    if (type == 'Status') {
      this.doStatusDiff();
    } else if (type == 'Play' || type == 'SelectTrack') {
      this.doNext();
    }
  };

  /**
   * Detects when track has changed, plus.
   */
  doStatusDiff() {

    const lastUri = Model.lastStatus.metadata['@_uri'];
    const currentUri = Model.status.metadata['@_uri'];

    if (currentUri != lastUri && !!currentUri && !Model.lastStatus.isEmpty) {
      if (this.ignoreNextNewTrackDetected) {
        // cl('statuser ignoring detect');
        this.ignoreNextNewTrackDetected = false;
      } else {
        // cl('statuser new-track');
        $(document).trigger('new-track');

        // Reset view-detect variables
        this.viewDetectUri = currentUri;
        this.viewDetectPastZeroStartTime = 0;
        this.viewDetectHasTriggered = false;
      }
    }

    // View detect logic
    if (currentUri == this.viewDetectUri && !this.viewDetectHasTriggered) {
      if (this.viewDetectPastZeroStartTime == 0) {
        if (Model.status.isPlaying && Model.status.position > 0.99) {
          this.viewDetectPastZeroStartTime = new Date().getTime();
        }
      } else {
        const delta = new Date().getTime() - this.viewDetectPastZeroStartTime;
        if (delta > VIEW_DETECT_DURATION_MS) {
          this.viewDetectHasTriggered = true;
          // cl('statuser - view detected')
          const hash = Model.library.getHashForUri(currentUri);
          if (!hash) {
            return;
          }
          if (MetaUtil.isEnabled) {
            // cl('statuser - incrementing numviews');
            MetaUtil.incrementNumViewsFor(hash);
            $(document).trigger('track-numviews-updated', [hash, MetaUtil.getNumViewsFor(hash)]);
          }
        }
      }
    }
  }
}

export default new Statuser();