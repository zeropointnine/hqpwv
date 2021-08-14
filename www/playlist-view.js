import Subview from './subview.js';
import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Commands from './commands.js';
import Service from './service.js';
import ModalPointerUtil from './modal-pointer-util.js';
import MetaUtil from './meta-util.js'
import PlaylistVo from './playlist-vo.js'
import PlaylistContextMenu from './playlist-context-menu.js';
import HistoryView from './history-view.js';

/**
 * Playlist view 'proper', containing list of tracks.
 */
export default class PlaylistView extends Subview {

  listItems$;
  $repeatButton;
  $historyButton;
  historyView;
  contextMenu;
  playlist;
  selectedUri = null;
  selectedIndex = -1;

  constructor($el) {
  	super($el);

  	this.$list = this.$el.find("#playlistList");
    this.$repeatButton = this.$el.find('#playlistRepeatButton');
    this.$historyButton = this.$el.find('#playlistHistoryButton');

    this.contextMenu = new PlaylistContextMenu();

  	this.$el.find("#playlistCloseButton").on("click tap", () => $(document).trigger('playlist-close-button'));
		this.$el.find("#playlistClearButton").on("click tap", this.onClearButton);

    this.$historyButton.addClass('isDisabled');
    this.$historyButton.on("click tap", () => $(document).trigger('playlist-history-button'));

    this.$repeatButton.on('click tap', this.onRepeatButton);

    Util.addAppListener(this, 'model-playlist-updated', this.populate);
    Util.addAppListener(this, 'model-library-updated', this.onModelLibraryUpdated);
	}

  onShow() {
    ViewUtil.setVisible(this.$el, true);
    ViewUtil.setFocus(this.$el);
    $(document).on('model-status-updated', this.updateSelectedItem);
    $(document).on('model-state-updated', this.updateRepeatButton);
    $(document).on('meta-track-incremented', this.onMetaTrackIncremented);

    Service.queueCommandFront(Commands.state());
  }

  onHide() {
    this.contextMenu.hide();
    $(document).off('model-status-updated', this.updateSelectedItem);
    $(document).off('model-state-updated', this.updateRepeatButton);
    $(document).off('meta-track-incremented', this.onMetaTrackIncremented);
  }

  populate() {
    this.selectedUri = null;
    this.selectedIndex = -1;

    this.updateRepeatButton();

    // Populate list items
    this.playlist = Model.playlist;
    this.listItems$ = [];
		this.$list.empty();

    if (this.playlist.array.length == 0) {
      const $nonItem = $(`<div class="playHisNonItem">Playlist is empty</span>`);
      this.$list.append($nonItem);
      return;
    }

    for (let i = 0; i < this.playlist.array.length; i++) { // todo do not reference model.playlist.array here
      const item = this.playlist.array[i];
      const itemPrevious = (i > 0) ? Model.playlist.array[i - 1] : null;
      const itemNext = (i < Model.playlist.array.length - 1) ? Model.playlist.array[i + 1] : null;
      const $item = this.makeListItem(i, item, itemPrevious, itemNext);
      $item.on("click tap", e => this.onItemClick(e));
      $item.find(".contextButton").on("click tap", e => this.onItemContextButtonClick(e));
      $item.find(".favoriteButton").on("click tap", e => this.onItemFavoriteButtonClick(e));
      this.listItems$.push($item);
      this.$list.append($item);
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

    this.removeSelectedClassFromListItems();

    if (!this.selectedUri) {
      return;
    }
    if (this.selectedIndex == -1) {
      cl('warning no match for uri');
      return;
    }
    const $item = $(this.$list.children()[this.selectedIndex]);
    $item.addClass("selected");

    if (this.selectedIndex > lastSelectedIndex) {
      Util.autoScrollListItem($item, this.$el, 4);
    }
  }

  removeSelectedClassFromListItems() {
    this.$list.children().each((i, item) => {
      $(item).removeClass("selected");
    });
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

	makeListItem(index, item, itemPrevious, itemNext) {

    let groupingClass = '';
    const isSameAsPrevious = this.areFromSameAlbum(item, itemPrevious);
    const isSameAsNext = this.areFromSameAlbum(item, itemNext);
    if (!isSameAsPrevious && isSameAsNext) {
      groupingClass = 'groupFirst';
    } else if (isSameAsPrevious && !isSameAsNext) {
      groupingClass = 'groupLast';
    } else if (isSameAsPrevious && isSameAsNext) {
      groupingClass = 'groupMiddle';
    } else { // isSameAsPrevious && isSameAsNext
      groupingClass = 'single';
    }

		let s = '';
		s += `<div class="playHisItem playlistItem ${groupingClass}" data-index="${index}">`;
    s += `  <div class="playHisItemLeft">${index+1}</div>`;
		s += `  <div class="playHisItemMain">${this.makeLabel(item)}</div>`;
    if (MetaUtil.isEnabled && Model.library.array.length > 0) {
      const hash = Model.library.getHashForPlaylistItem(item);
      if (hash) {
        const isFavorite = MetaUtil.isFavoriteFor(hash);
        const favoriteSelectedClass = isFavorite ? 'isSelected' : '';
        const numViews = MetaUtil.getNumViewsFor(hash);
        s += `<div class="playlistItemMeta">`;
        s += `<div class="playlistItemViews">${numViews || ''}</div>`;
        s += `<div class="iconButton toggleButton favoriteButton ${favoriteSelectedClass}" data-index="${index}"></div>`;
        s += `</div>`;
      }
    }
		s += `  <div class="playHisItemRight"><div class="contextButton iconButton moreButton" data-index="${index}"></div></div>`;
		s += `</div>`;
		return $(s);
	}

  areFromSameAlbum(track1, track2) {
    if (!track1 || !track2) {
      return false;
    }
    const uri1 = track1['@_uri'];
    const uri2 = track2['@_uri'];
    if (!uri1 || !uri2) {
      return false;
    }
    const base1 = Util.stripFilenameFromHqpUri(uri1);
    const base2 = Util.stripFilenameFromHqpUri(uri2);
    return (base1 === base2);
  }

	makeLabel(item) {
		const song = item['@_song'];
		const album = item['@_album'];
		const artist = item['@_artist'] || item['@_album_artist'];
    const seconds = parseFloat(item['@_length']);
		let result = '';
		if (song) {
			result += `<strong>${song}</strong>`;
		}
    if (seconds) {
      result += ` <span class="colorTextLess">(${Util.durationText(seconds)})</span>`;
    }
		if (artist) {
			result += result ? ('<br>' + artist) : artist;
		}
		if (album) {
			result += result ? ('<br>' + album) : album;
		}
		if (!result) {
			result = 'Track';
		}
		return result;
	}

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

  onClearButton = (e) => {
    Service.queueCommandsFront(
        [Commands.playlistClear(), Commands.playlistGet()]);
  };

  onRepeatButton = (e) => {
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

  onItemFavoriteButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const $button = $(event.currentTarget);
    const index = parseInt($button.attr("data-index"));
    const item = Model.playlist.array[index];
    const hash = Model.library.getHashForPlaylistItem(item);
    if (!hash) {
      cl('warning no hash for ', item['@_uri']);
      return;
    }
    const oldValue = MetaUtil.isFavoriteFor(hash);
    const newValue = !oldValue;
    // update button
    if (newValue) {
      $button.addClass('isSelected');
    } else {
      $button.removeClass('isSelected');
    }
    // update model
    MetaUtil.setFavoriteFor(hash, newValue);
  }

  onMetaTrackIncremented = (e, hash, count) => {
    for (let i = 0; i < this.playlist.array.length; i++) {
      const item = this.playlist.array[i];
      const $item = this.listItems$[i];
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
}
