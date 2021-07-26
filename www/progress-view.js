import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Commands from './commands.js';
import Service from './service.js';

/**
 * Horizontal progressbar with draggable thumb.
 */
export default class ProgressView {

  $el;
  $thumbOuter;
  $thumb;
  isDragging = false;
  ratio = 0;

  constructor() {
    this.$el = $('#playProgressView');
    this.$thumbOuter = this.$el.find('#playProgressThumbOuter');
    this.$thumb = this.$el.find('#playProgressThumb');

    this.$thumb.on('mousedown touchstart', this.startDrag);
    this.$el.on('click tap', this.onTrackClick);

    this.update(0.0);
  }

  get $el() {
    return this.$el;
  }

  /** Updates thumb pos using ratio. */
  update(ratio, forceUpdate = false) {
    ratio = Math.min(ratio, 1);
    ratio = Math.max(ratio, 0);
    this.ratio = ratio;
    if (!this.isDragging || forceUpdate) {
      this.$thumb.css('left', (this.ratio * 100) + "%");
    }
  }

  startDrag = (e) => {
    this.isDragging = true;
    $(window).on("mousemove touchmove", this.onDrag);
    $(window).on("mouseup touchend touchcancel", this.endDrag);
    const ratio = this.eventToRatioX(e);
    this.update(ratio, true);
  };

  onDrag = (e) => {
    const ratio = this.eventToRatioX(e);
    this.update(ratio, true);
  };

  endDrag = (e) => {
    this.isDragging = false;
    $(window).off("mouseup touchend touchcancel");
    $(window).off("mousemove touchmove");

    // Disable and then re-enable click handler #goodenough
    this.$el.off('click tap');
    setTimeout(() => this.$el.on('click tap', this.onTrackClick), 500);

    // Note, touchend does NOT provide any number values, so using last stored value.
    const seconds = Model.getStatusTrackSecondsFromRatio(this.ratio);
    if (seconds != -1) {
      Service.queueCommandFrontAndGetStatus(Commands.seek(seconds));
    }
  };

  onTrackClick = (e) => {
    const ratio = this.eventToRatioX(e);
    const seconds = Model.getStatusTrackSecondsFromRatio(ratio);
    if (seconds != -1) {
      Service.queueCommandFrontAndGetStatus(Commands.seek(seconds));
    }
  };

  /**
   * Given a mouse or touch event, return the equivalent x percentage value
   * across the scroll track or whatever.
   */
  eventToRatioX(e) {
    let x = ViewUtil.getClientX(e);
    if (isNaN(x)) {
      x = 0;
    }
    x = x - this.$thumbOuter.offset().left;
    const maxX = this.$thumbOuter.width();
    x = Math.min(x, maxX);
    x = Math.max(x, 0);
    return (x / maxX);
  }
}