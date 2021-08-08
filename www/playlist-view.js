import Subview from './subview.js';
import Util from './util.js';
import ViewUtil from './view-util.js';
import Model from './model.js';
import Commands from './commands.js';
import Service from './service.js';
import ModalPointerUtil from './modal-pointer-util.js';
import MetaUtil from './meta-util.js'
import PlaylistContextMenu from './playlist-context-menu.js';

/**
 * Playlist view containing a list of tracks
 */
export default class PlaylistView extends Subview {

  contextMenu;
  currentItems;
  listItems$;

  constructor() {
  	super($("#playlistView"));

  	this.$list = this.$el.find("#playlistList");

    this.contextMenu = new PlaylistContextMenu();

  	this.$el.find("#playlistCloseButton").on("click tap", () => $(document).trigger('playlist-close-button'));
		this.$el.find("#playlistClearButton").on("click tap", this.onClearButton);

    Util.addAppListener(this, 'model-playlist-updated', this.update);
    Util.addAppListener(this, 'model-library-updated', this.update);
    Util.addAppListener(this, 'track-numviews-updated', this.onTrackNumViewsUpdated);
	}

  show() {
    $(document).on('model-status-updated', this.updateSelectedItem);
  	super.show();
  	ViewUtil.animateCss(this.$el,
  		() => this.$el.css("top", this.$el.height() + "px"),
  		() => this.$el.css('top', '0px'),
  		null);
  }

  hide() {
    $(document).off('model-status-updated', this.updateSelectedItem);
    ViewUtil.animateCss(this.$el,
        null,
        () => this.$el.css("top", this.$el.outerHeight() + "px"),
        () => ViewUtil.setVisible(this.$el, false));
    this.contextMenu.hide();
  }

  update() {
    if (this.arePlaylistArraysEqual(this.currentItems, Model.playlistData)
        && (Model.playlistData.length > 0 &&  Model.library.array.length == 0)) {
      return;
    }
    this.currentItems = [];
    this.listItems$ = [];
		this.$list.empty();

    if (Model.playlistData.length == 0) {
      const $nonItem = $(`<div id="playlistNonItem">Playlist is empty</span>`)
      this.$list.append($nonItem);
    } else {
      for (let i = 0; i < Model.playlistData.length; i++) {
        const item = Model.playlistData[i];
        this.currentItems.push(item);
        const itemPrevious = (i > 0) ? Model.playlistData[i - 1] : null;
        const itemNext = (i < Model.playlistData.length - 1) ? Model.playlistData[i + 1] : null;
        const $item = this.makeListItem(i, item, itemPrevious, itemNext);
        $item.on("click tap", e => this.onItemClick(e));
        $item.find(".contextButton").on("click tap", e => this.onItemContextButtonClick(e));
        $item.find(".favoriteButton").on("click tap", e => this.onItemFavoriteButtonClick(e));
        this.listItems$.push($item);
        this.$list.append($item);
      }
    }

		this.updateSelectedItem();
	}

	updateSelectedItem = (e) => {
		if (Model.playlistData.length != Model.status.data['@_tracks_total']) {
			// playlist data is obviously out of sync
			this.selectItemByIndex(-1);
		} else if (!Model.playlistData.length || !(Model.status.data['@_tracks_total'] > -1)) {
			this.selectItemByIndex(-1);
		} else {
			this.selectItemByIndex(Model.status.data['@_track'] - 1); // bc 1-indexed
		}
	};

	selectItemByIndex(index) {
		this.$list.children().each((i, item) => {
			$(item).removeClass("selected");
		});
		const $itemToSelect = $(this.$list.children()[index]);
		$itemToSelect.addClass("selected");
	}

	makeListItem(index, item, itemPrevious, itemNext) {
    let cls = '';
    const isSameAsPrevious = this.areFromSameAlbum(item, itemPrevious);
    const isSameAsNext = this.areFromSameAlbum(item, itemNext);
    if (!isSameAsPrevious && isSameAsNext) {
      cls = 'groupFirst';
    } else if (isSameAsPrevious && !isSameAsNext) {
      cls = 'groupLast';
    } else if (isSameAsPrevious && isSameAsNext) {
      cls = 'groupMiddle';
    } else { // isSameAsPrevious && isSameAsNext
      cls = 'single';
    }

		let s = '';
		s += `<div class="playlistItem ${cls}" data-index="${index}">`;
		s += `  <div class="playlistItemLeft">${index+1}</div>`;
		s += `  <div class="playlistItemMain">${this.makeLabel(item)}</div>`;
    if (MetaUtil.isEnabled && Model.library.array.length > 0) {
      const hash = Model.library.uriToHashMap[item['@_uri']];
      if (!hash) {
        cl('info no hash for ', item['@_uri']);
      } else {
        const isFavorite = MetaUtil.isFavoriteFor(hash);
        const favoriteSelectedClass = isFavorite ? 'isSelected' : '';
        const numViews = MetaUtil.getNumViewsFor(hash);
        s += `<div class="playlistItemMeta">`;
        s += `<div class="playlistItemViews">${numViews || ''}</div>`;
        s += `<div class="iconButton toggleButton favoriteButton ${favoriteSelectedClass}" data-index="${index}"></div>`;
        s += `</div>`;
      }
    }
		s += `  <div class="playlistItemRight"><div class="contextButton iconButton moreButton" data-index="${index}"></div></div>`;
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

  onItemFavoriteButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const $button = $(event.currentTarget);
    const index = parseInt($button.attr("data-index"));
    const track = Model.playlistData[index];
    const hash = Model.library.uriToHashMap[track['@_uri']];
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

  onTrackNumViewsUpdated(hash, count) {
    for (let i = 0; i < this.currentItems.length; i++) {
      const item = this.currentItems[i];
      const $item = this.listItems$[i];
      const itemHash = Model.library.uriToHashMap[item['@_uri']];
      if (itemHash == hash) {
        $item.find('.playlistItemViews').text(count);
        break;
      }
    }
  }

  arePlaylistArraysEqual(a1, a2) {
    if (a1 == null || a2 == null) {
      return (a1 == null && a2 == null);
    }
    if (a1.length != a2.length) {
      return false;
    }
    for (let i = 0; i < a1.length; i++) {
      const el1 = a1[i];
      const el2 = a2[i];
      if (el1['@_uri'] != el2['@_uri']) {
        return false;
      }
    }
    return true;
  }
}
