import Values from'./values.js';
import Util from'./util.js';
import DataUtil from './data-util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import ViewUtil from './view-util.js'

/**
 *
 */
export default class VolumePanel {

  $el;
  $inner;
  $text;
  $plus3;
  $plus1;
  $minus1;
  $minus3;

  volume = null;

  constructor($el) {
    this.$el = $el;
    this.$inner = this.$el.find('#volumePanelInner');
    this.$text = this.$el.find('#volumeText');
    this.$plus3 = this.$el.find('#volumeUp3');
    this.$plus1 = this.$el.find('#volumeUp1');
    this.$minus1 = this.$el.find('#volumeDown1');
    this.$minus3 = this.$el.find('#volumeDown3');

    this.$plus3.on('click tap', (e) => this.adjustVolume(3));
    this.$plus1.on('click tap', (e) => this.adjustVolume(1));
    this.$minus1.on('click tap', (e) => this.adjustVolume(-1));
    this.$minus3.on('click tap', (e) => this.adjustVolume(-3));
  }

  get isShowing() {
    return ViewUtil.isVisible(this.$el);
  }

  show() {
  	ViewUtil.setVisible(this.$el, true);
    const startY = this.$inner.outerHeight();
    ViewUtil.animateCss(this.$inner,
  		() => { this.$inner.css("top", startY + "px"); },
  		() => { this.$inner.css('top', '0px'); },
  		null);
    this.update();

    $(document).on('model-status-updated', this.onModelStatus);
  }

  hide() {
    const endY = this.$inner.outerHeight();
    ViewUtil.animateCss(this.$inner,
        null,
        () => { this.$inner.css('top', endY + 'px'); },
        () => { ViewUtil.setVisible(this.$el, false); } );

    $(document).off('model-status-updated', this.onModelStatus);
  }

  update() {
    const previous = this.volume;
    this.volume = Model.status.volume;
    if (this.volume == previous) {
      return;
    }
    const s = (!isNaN(this.volume)) ? (this.volume + 'dB') : ' ';
    this.$text.text(s);
	}

  adjustVolume(amount) {
    amount = Math.min(amount, 3);
    amount = Math.max(amount, -3);
    const command = (amount > 0) ? Commands.volumeUp() : Commands.volumeDown();
    const commands = [];
    for (let i = 0; i < Math.abs(amount); i++) {
      commands.push(command);
    }
    commands.push(Commands.status());
    Service.queueCommandsFront(commands);
  }

  onModelStatus = () => {
    this.update();
  }
}
