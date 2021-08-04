import Util from './util.js';
import Values from './values.js';
import Model from './model.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Service from './service.js';
import Busyer from './busyer.js';

const INTERVAL_FAST = 500;
const INTERVAL_PLAYING = 1000;
const INTERVAL_NOT_PLAYING = 10000;

/**
 * Makes `status` calls periodically, based on app state and activity.
 * Idea is to make calls more frequently when there's a known delay btw
 * a 'command' and an hqp state change. Plus fast interval while playing, ofc.
 */
class Statuser {

  /**
   * The id of the last setTimeout that was called.
   */
  timeoutId;
  currentStatus = {};
  lastStatus = {};

  ignoreNextNewTrackDetected = false;
  
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
      duration = ModelUtil.isPlaying() ? INTERVAL_PLAYING : INTERVAL_NOT_PLAYING;
    }
    this.timeoutId = setTimeout(() => this.doNext(), duration);
  }
  
  onServiceResponseHandled = (e, type, data) => {

    if (type == 'Status') {

      this.lastStatus = this.currentStatus;
      this.currentStatus = data['Status'];

      // cl(`${Values.uptimeString} got status, state= ${this.currentStatus['@_state']} laststate=${this.lastStatus['@_state']}`);

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
        cl('statuser ignoring detect')
        this.ignoreNextNewTrackDetected = false;
      } else {
        cl(`${Values.uptimeString} statuser - ${name} ${Model.statusData['metadata']['@_samplerate']}`);
        $(document).trigger(name);
      }
    };

    const isPlayToPlay = (this.lastStatus['@_state'] != '0' && this.currentStatus['@_state'] != '0');
    const isStopToPlay = (this.lastStatus['@_state'] == '0' && this.currentStatus['@_state'] != '0');

    if (isPlayToPlay) {
      const lastTrack = parseInt(this.lastStatus['@_track']);
      const currentTrack = parseInt(this.currentStatus['@_track']);
      if (isNaN(lastTrack) || isNaN(currentTrack)) {
        cl('warning current or last status track - bad data');
      } else {
        const didTrackChange = (currentTrack != lastTrack);
        if (didTrackChange) {
          cl('statuser detected track change');
          sendEventMaybe('play-to-play');
        }
      }
    } else if (isStopToPlay) {
      cl('statuser detected stop-to-play');
      sendEventMaybe('stop-to-play');
    }

    // todo take duration between samples into account?!
    // todo also, verify play @_position?
  }
}

export default new Statuser();