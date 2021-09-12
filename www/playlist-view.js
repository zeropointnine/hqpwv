import Commands from './commands.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import PlaylistContextMenu from './playlist-context-menu.js';
import PlaylistSavePanel from './playlist-save-panel.js';
import TrackListItemUtil from './track-list-item-util.js';
import PlaylistVo from './playlist-vo.js'
import Service from './service.js';
import Settings from './settings.js';
import Subview from './subview.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 * Playlist view 'proper', containing list of tracks.
 */
export default class PlaylistView extends Subview {

  $repeatButton;
  $historyButton;
  $loadButton;
  $saveButton;
  savePanel;
  contextMenu;
  playlist;
  trackItems$;
  selectedUri = null;
  selectedIndex = -1;

  constructor($el) {
  	super($el);

  	this.$list = this.$el.find("#playlistList");
    this.$repeatButton = this.$el.find('#playlistRepeatButton');
    this.$historyButton = this.$el.find('#playlistHistoryButton');
    this.$loadButton = this.$el.find('#playlistLoadButton');
    this.$saveButton = this.$el.find('#playlistSaveButton');

    this.savePanel = new PlaylistSavePanel(this.$el.find('#playlistSaver'));
    this.contextMenu = new PlaylistContextMenu();

  	this.$el.find("#playlistCloseButton").on("click tap", () => $(document).trigger('playlist-close-button'));
		this.$el.find("#playlistClearButton").on("click tap", this.onClearButton);

    this.$historyButton.addClass('isDisabled');
    this.$historyButton.on("click tap", () => $(document).trigger('playlist-history-button'));

    this.$loadButton.on("click tap", () => $(document).trigger('playlist-load-button'));
    this.$saveButton.on("click tap", this.onSaveButton);
    this.$repeatButton.on('click tap', this.onRepeatButton);

    Util.addAppListener(this, 'model-playlist-updated', this.populate);
    Util.addAppListener(this, 'model-library-updated', this.onModelLibraryUpdated);
    const f = TrackListItemUtil.makeTrackMetaChangeHandler(this.$list);
    $(document).on('meta-track-favorite-changed meta-track-incremented', f); // fyi, must persist
	}

  onShow() {
    ViewUtil.setVisible(this.$el, true);
    ViewUtil.setFocus(this.$el);
    $(document).on('model-status-updated', this.updateSelectedItem);
    $(document).on('model-state-updated', this.updateRepeatButton);
    $(document).on('new-track', this.onNewTrack);
    this.updateSaveButton();
    this.showSavePanel(false);

    Service.queueCommandFront(Commands.state());
  }

  onHide() {
    this.contextMenu.hide();
    $(document).off('model-status-updated', this.updateSelectedItem);
    $(document).off('model-state-updated', this.updateRepeatButton);
    $(document).off('new-track', this.onNewTrack);
  }

  populate() {
    this.selectedUri = null;
    this.selectedIndex = -1;

    this.updateRepeatButton();

    this.playlist = Model.playlist;
    this.updateSaveButton();
    this.trackItems$ = [];
		this.$list.empty();

    if (this.playlist.array.length == 0) {

      const $nonItem = $(`<div class="playHisNonItem">Playlist is empty</span>`);
      this.$list.append($nonItem);

    } else {

      this.trackItems$ = TrackListItemUtil.populateList(this.$list, this.playlist.array);

      for (const $item of this.trackItems$) {
          $item.on("click tap", this.onItemClick);
          $item.find(".contextButton").on("click tap", this.onItemContextButton);
      }
    }

    this.updateSelectedItem();
	}

	updateSelectedItem = () => {
    // nb, must use status.metadata.uri to determine current track.
		// status[track] is not correct when track is changed while in paused state.
    const uri = Model.status.metadata['@_uri']; // rem, is undefined when stopped
    this.selectItemByUri(uri);
	};

  selectItemByUri(uri=null) {
    if (uri == this.selectedUri) {
      return;
    }

    this.selectedUri = uri;
    const lastSelectedIndex = this.selectedIndex;
    this.selectedIndex = Model.playlist.getIndexByUri(this.selectedUri);
    if (this.selectedIndex == -1) {
      // can happen between stop and play states or smth
    }

    if (!this.trackItems$) {
      // can happen on startup somehow
      // console.trace();
      return;
    }

    for (let i = 0; i < this.trackItems$.length; i++) {
      const $item = this.trackItems$[i];
      if (i == this.selectedIndex) {
        $item.addClass("selected");
      } else {
        $item.removeClass("selected");
      }
    }
  }

  updateRepeatButton = () => {
    if (Model.state.isRepeatAll) {
      this.$repeatButton.removeClass('isOne').addClass('isAll');
      this.$repeatButton.text('Repeat all');
    } else if (Model.state.isRepeatOne) {
      this.$repeatButton.removeClass('isAll').addClass('isOne');
      this.$repeatButton.text('Repeat track');
    } else { // no-repeat
      this.$repeatButton.removeClass('isAll isOne');
      this.$repeatButton.text('Repeat off');
    }
  };

  updateSaveButton() {
    const b = (this.playlist && this.playlist.array.length > 0);
    if (b) {
      this.$saveButton.removeClass('isDisabled')
    } else {
      this.$saveButton.addClass('isDisabled');
    }
  }

  showSavePanel(b) {
    if (b) {
      this.savePanel.show();
    } else {
      this.savePanel.hide();
    }
  }

  onItemClick = (event) => {
		const index = parseInt($(event.currentTarget).attr("data-index"));
		Service.queueCommandFrontAndGetStatus(
        Commands.selectTrack(index + 1)); // rem, 1-indexed
	};

	onItemContextButton = (event) => {
    event.stopPropagation();
    const $button = $(event.currentTarget);
    const $listItem = $button.parent().parent();
    const index = parseInt($listItem.attr('data-index'));
    if (!(index >= 0)) {
      cl('warning no index');
      return;
    }
    this.contextMenu.show(this.$el, $button, index);
	}

  onClearButton = () => {
    Service.queueCommandsFront([Commands.playlistClear(), Commands.playlistGet()]);
  };

  onRepeatButton = () => {
    // none -> all -> one
    let value;
    if (this.$repeatButton.hasClass('isAll')) {
      value = '1'; // set to one
    } else if (this.$repeatButton.hasClass('isOne')) {
      value = '0'; // set to none
    } else { // is-none
      value = '2'; // set to all
    }
    Service.queueCommandsFront([Commands.setRepeat(value), Commands.state()]);
  };

  onModelLibraryUpdated() {
    this.$historyButton.removeClass('isDisabled');
    this.populate();
  }

  onSaveButton = () => {
    const b = ViewUtil.isDisplayed(this.savePanel.$el);
    this.showSavePanel(!b);
  };

  onNewTrack = (e, currentUri, lastUri) => {
    const currentIndex = this.playlist.getIndexByUri(currentUri);
    const lastIndex = this.playlist.getIndexByUri(lastUri);
    if (currentIndex > -1) {
      if (currentIndex > lastIndex) {
        const $item = this.trackItems$[currentIndex];
        Util.autoScrollListItem($item, this.$el);
      }
    }
  };
}
