import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Commands from './commands.js';
import Service from './service.js';

/**
 * Clickable horizontal progressbar with draggable thumb.
 */
export default class ProgressView {

  $el;
  $inner;
  $thumb;
  isDragging = false;
  ratio = 0;

  constructor() {
    this.$el = $('#playProgressView');
    this.$inner = this.$el.find('#playProgressInner');
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
    $(document).trigger('progress-thumb-drag', ratio);
  };

  onDrag = (e) => {
    this.dragRatio = this.eventToRatioX(e);
    this.update(this.dragRatio, true);
    $(document).trigger('progress-thumb-drag', this.dragRatio);
  };

  dragRatio = 0;

  endDrag = (e) => {
    this.isDragging = false;
    $(window).off("mouseup touchend touchcancel");
    $(window).off("mousemove touchmove");

    // Disable and then re-enable click handler #goodenough
    this.$el.off('click tap');
    setTimeout(() => this.$el.on('click tap', this.onTrackClick), 500);

    // touchend does NOT provide any number values, so must use last stored value.
    const seconds = Model.status.getSecondsFromRatio(this.dragRatio);
    if (seconds != -1) {
      Service.queueCommandFrontAndGetStatus(Commands.seek(seconds));
    }
  };

  onTrackClick = (e) => {
    const ratio = this.eventToRatioX(e);
    const seconds = Model.status.getSecondsFromRatio(ratio);
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
    x = x - this.$inner.offset().left;
    const maxX = this.$inner.width();
    x = Math.min(x, maxX);
    x = Math.max(x, 0);
    return (x / maxX);
  }
}