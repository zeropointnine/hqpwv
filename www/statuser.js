import Model from './model.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Service from './service.js';

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
  lastStatus;
  lastStatusTime;

  // Acts as a state flag and a counter
  // Used when we anticipate that playback is about to begin
  // (state is playing but position stays at 0 for a short while)
  windupCounter = 0;

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

    if (this.windupCounter > 0) {
      if (this.shouldResetWindupCounter()) {
        this.windupCounter = 0;
        $(document).trigger('windup-stop');
      } else {
        this.windupCounter++;
        if (this.windupCounter > 30) {
          cl('warning windupCounter failsafe reset');
          this.windupCounter = 0;
          $(document).trigger('windup-stop');
        }
      }
    }

    let duration;
    if (this.windupCounter > 0) {
      duration = INTERVAL_FAST;
    } else {
      duration = ModelUtil.isPlaying() ? INTERVAL_PLAYING : INTERVAL_NOT_PLAYING;
    }

    this.timeoutId = setTimeout(() => this.doNext(), duration);
  }
  
  shouldResetWindupCounter() {
    if (ModelUtil.isPlaying()) {
      const pos = parseFloat(Model.statusData['@_position']);
      if (pos > 0) {
        return true;
      }
    }
    return false;
  }
  
  onServiceResponseHandled = (e, type, data) => {

    if (type == 'Status') {
      
      this.detectNewTrack(data);
      
    } else if (type == 'Play' || type == 'SelectTrack') {
      
      if (ModelUtil.isStopped() && ModelUtil.isResultOk(data)) {
        // A 'start playing' command happened while player was stopped.
        this.windupCounter = 1;
        $(document).trigger('windup-start');
        this.doNext();
      }
    }
  };

  /**
   * Can be thought of as a special "substate" of "isPlaying" where
   * position remains at 0 for up to a few seconds. Delay manifests itself
   * after upscaling settings have been changed to something demanding, basically.
   */
  isWindingUp() {
    return (this.windupCounter > 0);
  }

  /**
   * Detects if a track has either
   * 1) changed while in a playing state or
   * 2) started playing from a stopped state
   */
  detectNewTrack(data) {

    const sendEventMaybe = () => {
      if (this.ignoreNextNewTrackDetected) {
        // todo: flag action could be too brittle of an approach
        // cl('statuser ignoring detect')
        this.ignoreNextNewTrackDetected = false;
      } else {
        cl('statuser - new-track-detected event', Model.statusData['metadata']['@_samplerate']);
        $(document).trigger('new-track-detected');
      }
    };

    const currentStatus = data['Status'];
    const currentStatusTime = new Date().getTime();

    if (this.lastStatus) {

      const isPlayToPlay = (this.lastStatus['@_state'] != '0' && currentStatus['@_state'] != '0');
      const isStopToPlay = (this.lastStatus['@_state'] == '0' && currentStatus['@_state'] != '0');

      if (isPlayToPlay) {
        const lastTrack = parseInt(this.lastStatus['@_track']);
        const currentTrack = parseInt(currentStatus['@_track']);
        if (isNaN(lastTrack) || isNaN(currentTrack)) {
          cl('warning current or last status track - bad data');
        } else {
          const didTrackChange = (currentTrack != lastTrack);
          if (didTrackChange) {
            // cl('statuser detected track change');
            sendEventMaybe();
          }
        }
      } else if (isStopToPlay) {
        // cl('statuser detected stop-to-play');
        sendEventMaybe();
      }
    }

    this.lastStatus = currentStatus;
    this.lastStatusTime = currentStatusTime;
    // todo take duration between samples into account?!
    // todo also, verify play @_position?
  }
}

export default new Statuser()