import Model from './model.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Service from './service.js';

const INTERVAL_PLAYING = 1000;
const INTERVAL_NOT_PLAYING = 10000;

/**
 * Makes `status` calls periodically, based on app state and activity.
 * Idea is to make calls more frequently when there's a known delay btw
 * a 'command' and an hqp state change. Plus fast interval while playing, ofc.
 *
 * A setTimeout should always be pending.
 */
class Statuser {

  /**
   * The id of the last setTimeout that was called.
   */
  timeoutId;
  /**
   * Special queue of quick timeout values which supercedes
   * the state-based timeout values that would otherwise be used.
   * The idea is to trigger quick updates to status until it's
   */
  queue = [];

  constructor() {
    $(document).on('service-response-handled', this.onServiceResponseHandled);
  }

  start() {
    this.queue = [500];
    this.doNext();
  }

  stop() {
    clearTimeout(this.timeoutId);
    this.queue = [];
  }

  doNext() {
    clearTimeout(this.timeoutId);
    Service.queueCommandFront(Commands.status());

    let duration;
    if (this.queue.length > 0) {
      duration = this.queue[0];
      this.queue.shift();
      // cl(duration, 'bc took from q, wc is now', this.queue);
    } else {
      duration = ModelUtil.isPlaying()
          ? INTERVAL_PLAYING
          : INTERVAL_NOT_PLAYING;
      // cl(duration, 'bc state')
    }
    this.timeoutId = setTimeout(() => this.doNext(), duration);
  }
  
  onServiceResponseHandled = (e, type, data) => {
    if (type == 'Status') {
      if (ModelUtil.isPlaying() && this.queue.length > 0) {
        // There is a 'quick queue' 'in progress', but we now know that hqp is playing,
        // so no more need for it.
        this.queue = [];
        // cl('discard queue');
      }
      return;
    }

    if (type == 'Play') {
      if (!ModelUtil.isPlaying() && data['Play']['@_result'] != 'Error') {
        // When a play command happens while current known play state is not 'play',
        // send 'status' immediately, followed by a specified series of quicker timeouts.
        this.queue = [250, 250, 250, 250, 500, 500, 500, 500, 1000, 1000, 1000];
        this.doNext();
      }
      return;
    }
    // todo other cases to handle?
  }
}

export default new Statuser()