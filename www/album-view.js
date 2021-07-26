import Subview from'./subview.js';
import Values from'./values.js';
import Util from'./util.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import ViewUtil from './view-util.js'
import AlbumContextMenu from './album-context-menu.js';

/**
 * Album view containing a header and a list of track list items.
 */
export default class AlbumView extends Subview {

  $list;
  listItems$;
  contextMenu;

  album = null; // album object
  tracks = null; // tracks array of album object

  lastPlayingSong = null;

  constructor() {
    super($("#albumView"));

  	this.$list = this.$el.find("#albumList");

    this.contextMenu = new AlbumContextMenu($("#albumContextMenu"));

		$("#albumPlayNowButton").on("click tap", this.onPlayNowButton);
		$("#albumQueueButton").on("click tap", this.onQueueButton);
		$("#albumCloseButton").on("click tap", () => $(document).trigger('album-view-close-button', this.album, true));
  }

  show() {
  	super.show();
    this.$el[0].scrollTop = 0;
  	ViewUtil.animateCss(this.$el,
  		() => { this.$el.css("top", this.$el.height() / 3 + "px"); this.$el.css('opacity', 0); },
  		() => { this.$el.css('top', '0px'); this.$el.css('opacity', 1); },
  		null);
    $(document).on('model-status-updated', this.updateHighlightedTrack);
  }

  hide() {
    super.hide();
    this.contextMenu.hide();
    $(document).off('model-status-updated', this.updateHighlightedTrack);
  }

  update(album) {
  	this.album = album;
  	this.tracks = Model.getTracksOf(this.album);

  	this.listItems$ = [];
		this.$list.empty();

		if (!this.album) {
			return;
		}
    const imgPath = ModelUtil.getAlbumImageUrl(this.album);
		$("#albumViewPicture").attr('src', imgPath);
		$("#albumViewTitle").html(this.album['@_album']);
		$("#albumViewArtist").html(this.album['@_artist']);
		$("#albumViewStats").html(this.makeStatsText());

		for (let i = 0; i < this.tracks.length; i++) { // todo fault
			const item = this.tracks[i];
			const $item = $(this.makeListItem(i, item));
			$item.on("click tap", e => this.onItemClick(e));
			$item.find(".moreButton").on("click tap", e => this.onItemContextButtonClick(e));
			this.listItems$.push($item);
			this.$list.append($item);
		}

		this.lastPlayingSong = undefined;
		this.updateHighlightedTrack();
	}

	makeListItem(index, item) {
		const seconds = parseInt(item['@_length']);
		const duration = seconds ? ` <span class="albumItemDuration">(${Util.durationText(seconds)})</span>` : '';
		const song = item['@_song'];
		let s = '';
		s += `<div class="albumItem" data-index="${index}">`;
		s += `  <div class="albumItemLeft">${index+1}</div>`;
		s += `  <div class="albumItemMain">${song}${duration}</div>`;
		s += `  <div class="albumItemRight"><div class="iconButton moreButton" data-index="${index}"></div></div>`;
		s += `</div>`;
		return $(s);
		// also: [$]["name"] is filename; [$]["hash"];
	}

	updateHighlightedTrack = () => {
		if (!this.tracks) {
			return;
		}
    const meta = ModelUtil.getPlayingSongMetadata();
    const song = meta ? meta['@_song'] : '';
    if (song === this.lastPlayingSong) {
     return;
    }
    this.lastPlayingSong = song;

    const isInAlbum = ModelUtil.doesAlbumContainPlayingSong(this.album);

    for (let i = 0; i < this.tracks.length; i++) {
			const track = this.tracks[i];
			let b;
      if (!isInAlbum) {
        b = false;
      } else {
        b = ModelUtil.doesAlbumSongEqualPlayingSong(this.album, track);
      }
			const $listItem = this.listItems$[i];
			b ? $listItem.addClass('selected') : $listItem.removeClass('selected');
		}
	};

	onPlayNowButton = (event) => {
    const commands = Commands.addTrackUsingAlbumAndIndices(this.album, 0, this.tracks.length - 1, true);
    Service.queueCommandsFront(commands);
	};

	onQueueButton = (event) => {
    const commands = Commands.addTrackUsingAlbumAndIndices(this.album, 0, this.tracks.length - 1, false);
    Service.queueCommandsFront(commands);
	};

	onItemClick(event) {
		const index = $(event.currentTarget).attr("data-index");
		const item = this.tracks[index];
		console.log(item);
		$(document).trigger('album-item-click', item);
	}

	onItemContextButtonClick(event) {
		event.stopPropagation(); // prevent listitem from responding to same event
		const $button = $(event.currentTarget);
		const index = parseInt($button.attr("data-index"));
    this.contextMenu.show(this.$el, $button, this.album, index);
	}

	makeStatsText() {
    const duration = this.makeAlbumDurationText();
		const date = this.album['@_date'];
		const genre = this.album['@_genre'];
		const rate = this.album['@_rate'];
		const bits = this.album['@_bits'];

    let s = '';

		if (date) {
			s = s ? (s + ' | ' + date) : date;
		}
		if (genre) {
			s = s ? (s + ' | ' + genre) : genre;
		}
		if (rate || bits) {
			let s2 = '';
			if (rate) {
				s2 = rate;
			}
			if (bits) {
				s2 = s2 ? (rate + '/' + bits) : bits;
			}
			s = s ? s + '<br>' + s2 : s2;
		}
    if (duration) {
      s = s ? s + ('<br>' + duration) : duration;
    }

		return s;
	}

  /** Returns album total duration display text, or empty string if fail. */
  makeAlbumDurationText() {
    if (!this.tracks || this.tracks.length == 0) {
      return '';
    }
    let albumSeconds = 0;
    for (let item of this.tracks) {
      const trackSeconds = parseFloat(item['@_length']);
      if (isNaN(trackSeconds)) {
        return ''; // unexpected; give up
      }
      albumSeconds += trackSeconds;
    }
    const result = Util.durationTextHoursMinutes(albumSeconds);
    return result;
  }
}
