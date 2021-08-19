import Util from './util.js';
import Values from './values.js';
import Model from './model.js';
import DataUtil from './data-util.js';
import Commands from './commands.js';
import Service from './service.js';
import Statuser from './statuser.js';

const TIMEOUT = 20 * 1000;

/**
 * Logic for determining 'busy' state.
 */
class Busyer {

  _isBusy = false;
  startTime = 0;

  constructor() {
    $(document).on('service-response-handled', this.onServiceResponseHandled);
  }

  get isBusy() {
    return this._isBusy;
  }

  startBusy() {
    if (this._isBusy) {
      cl('is already busy');
      return;
    }
    this.startTime = new Date().getTime();
    // cl(`busy-start`);
    this._isBusy = true;
    $(document).trigger('busy-start');
  }

  stopBusy() {
    if (!this._isBusy) {
      cl('is already stopped');
      return;
    }
    const dur = Util.makeCasualSecondsString(new Date().getTime() - this.startTime);
    // cl(`busy-stop (${dur})`);
    this._isBusy = false;
    $(document).trigger('busy-stop');
  }

  onServiceResponseHandled = (e, type) => {

    let shouldChangeToTrue = false;
    if (!this._isBusy) {
      if (type == 'Play' || type == 'SelectTrack' || type == 'Previous' || type == 'Next') {
        if (!Model.status.isPaused) {
          // An action which will start or change a track, while in a playing or stopped state
          shouldChangeToTrue = true;
        }
      } else if (type == 'Status') {
        if (Model.status.isPlaying && Model.status.position == 0
            && Model.lastStatus.isPlaying && Model.lastStatus.position == 0) {
          // Has sat at 0:00, must be winding up to play for real
          shouldChangeToTrue = true;
        } else if (Model.lastStatus.position == 0 && Model.lastStatus.isPaused && Model.status.isPlaying) {
          // Went from paused @ 0:00 to play
          cl('unpause from start of track');
          shouldChangeToTrue = true;
        }
      }
    }
    
    let shouldChangeToFalse = false;
    if (this._isBusy) {
      if (type == 'Stop' || type == 'Pause') {
        shouldChangeToFalse = true;
      } else if (type == 'Status') {
        if (!Model.status.isPlaying) {
          shouldChangeToFalse = true;
        } else if (Model.status.position > 0) {
          // Is playing and past 0:00
          shouldChangeToFalse = true;
        }
      } else if (new Date().getTime() - this.startTime > TIMEOUT) {
        cl('warning busy timeout, will clear');
        shouldChangeToFalse = true;
      }
    }

    if (shouldChangeToTrue && shouldChangeToFalse) {
      cl('warning logic issue')
    } else if (shouldChangeToTrue) {
      this.startBusy();
    } else if (shouldChangeToFalse) {
      this.stopBusy();
    }
  };
}

export default new Busyer();