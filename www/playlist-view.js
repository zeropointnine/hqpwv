import Commands from './commands.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import PlaylistContextMenu from './playlist-context-menu.js';
import PlaylistSavePanel from './playlist-save-panel.js';
import PlaylistViewUtil from './playlist-view-util.js';
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
    Util.addAppListener(this, 'settings-meta-changed', this.updateMetaButtons);
    Util.addAppListener(this, 'meta-load-result', this.updateMetaButtons);
	}

  onShow() {
    ViewUtil.setVisible(this.$el, true);
    ViewUtil.setFocus(this.$el);
    $(document).on('model-status-updated', this.updateSelectedItem);
    $(document).on('model-state-updated', this.updateRepeatButton);
    $(document).on('meta-track-incremented', this.onMetaTrackIncremented);
    $(document).on('new-track', this.onNewTrack);

    this.updateMetaButtons();
    this.showSavePanel(false);

    Service.queueCommandFront(Commands.state());
  }

  onHide() {
    this.contextMenu.hide();
    $(document).off('model-status-updated', this.updateSelectedItem);
    $(document).off('model-state-updated', this.updateRepeatButton);
    $(document).off('meta-track-incremented', this.onMetaTrackIncremented);
    $(document).off('new-track', this.onNewTrack);
  }

  populate() {
    this.selectedUri = null;
    this.selectedIndex = -1;

    this.updateRepeatButton();

    // Populate list items
    this.playlist = Model.playlist;
    this.trackItems$ = [];
		this.$list.empty();

    if (this.playlist.array.length == 0) {

      const $nonItem = $(`<div class="playHisNonItem">Playlist is empty</span>`);
      this.$list.append($nonItem);

    } else {

      for (let i = 0; i < this.playlist.array.length; i++) { // todo do not reference model.playlist.array here

        const item = this.playlist.array[i];
        const itemPrevious = (i > 0) ? Model.playlist.array[i - 1] : null;
        const itemNext = (i < Model.playlist.array.length - 1) ? Model.playlist.array[i + 1] : null;
        const album = Model.library.getAlbumByTrackUri(item['@_uri']);

        const $albumLine = PlaylistViewUtil.makeAlbumHeader(album, item, itemPrevious);
        if ($albumLine) {
          this.$list.append($albumLine);
          $albumLine.find('.playlistAlbumButton').on('click tap', this.onAlbumButton);
        }

        const $item = PlaylistViewUtil.makeListItem(i, item, itemPrevious, itemNext, album);
        $item.on("click tap", e => this.onItemClick(e));
        $item.find(".contextButton").on("click tap", e => this.onItemContextButtonClick(e));
        $item.find(".favoriteButton").on("click tap", e => PlaylistViewUtil.onItemFavoriteButtonClick(e));

        this.trackItems$.push($item);
        this.$list.append($item);
      }
    }

    this.updateSelectedItem();
    this.updateMetaButtons();
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

	onItemClick(event) {
		const index = parseInt($(event.currentTarget).attr("data-index"));
		Service.queueCommandFrontAndGetStatus(
        Commands.selectTrack(index + 1)); // rem, 1-indexed
	}

	onItemContextButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const button = event.currentTarget;
    const index = parseInt($(button).attr("data-index"));
    this.contextMenu.show(this.$el, $(button), index);
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

  onMetaTrackIncremented = (e, hash, count) => {
    for (let i = 0; i < this.playlist.array.length; i++) {
      const item = this.playlist.array[i];
      const $item = this.trackItems$[i];
      const itemHash = Model.library.getHashForPlaylistItem(item);
      if (itemHash == hash) {
        $item.find('.playlistItemViews').text(count);
        break;
      }
    }
  };

  onModelLibraryUpdated() {
    this.$historyButton.removeClass('isDisabled');
    this.populate();
  }

  onAlbumButton = (e) => {
    const $el = $(e.currentTarget);
    const hash = $el.attr('data-hash');
    const album = Model.library.getAlbumByAlbumHash(hash);
    if (!album) {
      return;
    }
    $(document).trigger('playlist-context-album', album);
  };

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

  showSavePanel(b) {
    if (b) {
      this.savePanel.show();
    } else {
      this.savePanel.hide();
    }
  }

  updateMetaButtons() {
    // buttons' visibility
    ViewUtil.setDisplayed(this.$loadButton, Settings.isMetaEnabled);
    ViewUtil.setDisplayed(this.$saveButton, Settings.isMetaEnabled && !Values.areOnDifferentMachines);
    ViewUtil.setDisplayed(this.$historyButton, Settings.isMetaEnabled);
    // load and history button enabledness
    const loadAndHistoryEnabled = (Settings.isMetaEnabled && MetaUtil.isEnabled);
    if (loadAndHistoryEnabled) {
      this.$loadButton.removeClass('isDisabled');
      this.$historyButton.removeClass('isDisabled');
    } else {
      this.$loadButton.addClass('isDisabled');
      this.$historyButton.addClass('isDisabled');
    }
    // save button enabledness
    const saveEnabled = (Settings.isMetaEnabled && MetaUtil.isEnabled)
        && (this.playlist && this.playlist.array.length > 0);
    if (saveEnabled) {
      this.$saveButton.removeClass('isDisabled');
    } else {
      this.$saveButton.addClass('isDisabled');
    }
  }
}
