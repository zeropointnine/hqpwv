import Subview from'./subview.js';
import Values from'./values.js';
import Util from'./util.js';
import ModelUtil from './model-util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import ViewUtil from './view-util.js'
import MetaUtil from './meta-util.js'
import AlbumContextMenu from './album-context-menu.js';

/**
 * Album view containing a header and a list of track list items.
 */
export default class AlbumView extends Subview {

  $picture;
  $list;
  listItems$;
  contextMenu;

  album = null; // album object
  tracks = null; // tracks array of album object

  currentPlayingSong = null;
  currentPlayingSongAlbumIndex = -1;

  constructor() {
    super($("#albumView"));
    this.$picture = $("#albumViewPicture");

  	this.$list = this.$el.find("#albumList");

    this.contextMenu = new AlbumContextMenu($("#albumContextMenu"));

		$("#albumPlayNowButton").on("click tap", this.onPlayNowButton);
		$("#albumQueueButton").on("click tap", this.onQueueButton);
		$("#albumCloseButton").on("click tap", () => $(document).trigger('album-view-close-button', this.album, true));
    this.$picture.on('click tap', () => $(document).trigger('album-picture-click', this.$picture));
  }

  show() {
  	super.show();
    this.$el[0].scrollTop = 0;
  	ViewUtil.animateCss(this.$el,
  		() => { this.$el.css("top", this.$el.height() / 3 + "px"); this.$el.css('opacity', 0); },
  		() => { this.$el.css('top', '0px'); this.$el.css('opacity', 1); },
  		null);

    $(document).on('model-status-updated', this.updateHighlightedTrack);
    $(document).on('track-numviews-updated', this.onTrackNumViewsUpdated);

    this.currentPlayingSongAlbumIndex = -1;
  }

  hide() {
    super.hide();
    this.contextMenu.hide();
    $(document).off('model-status-updated', this.updateHighlightedTrack);
    $(document).off('track-numviews-updated', this.onTrackNumViewsUpdated);
  }

  update(album) {
  	this.album = album;
  	this.tracks = Model.getTracksOf(this.album);

  	this.listItems$ = [];
		this.$list.empty();

		if (!this.album) {
			return;
		}

    this.updateInfoArea();

    for (let i = 0; i < this.tracks.length; i++) { // todo fault
      const item = this.tracks[i];
      const $item = $(this.makeListItem(i, item));
      $item.on("click tap", e => this.onItemClick(e));
      $item.find(".moreButton").on("click tap", e => this.onItemContextButtonClick(e));
      $item.find(".favoriteButton").on("click tap", e => this.onItemFavoriteButtonClick(e));
      this.listItems$.push($item);
      this.$list.append($item);
    }

		this.currentPlayingSong = undefined;
		this.updateHighlightedTrack();
	}

  updateInfoArea() {
    const imgPath = ModelUtil.getAlbumImageUrl(this.album);
    this.$picture.attr('src', imgPath);

    $("#albumViewTitle").html(this.album['@_album']);
    $("#albumViewArtist").html(this.album['@_artist']);
    $("#albumViewStats").html(this.makeStatsText());
    $("#albumViewPath").html(this.album['@_path']);
  }

	makeListItem(index, item) {
		const seconds = parseInt(item['@_length']);
		const duration = seconds ? ` <span class="albumItemDuration">(${Util.durationText(seconds)})</span>` : '';
		const song = item['@_song'];
		let s = '';
    s += `<div class="albumItem" data-index="${index}">`;
		s += `<div class="albumItemLeft">${index+1}</div>`;
		s += `<div class="albumItemMain">${song}${duration}</div>`;
    if (MetaUtil.isEnabled) {
      const hash = item['@_hash'];
      const isFavorite = MetaUtil.isFavoriteFor(hash);
      const favoriteSelectedClass = isFavorite ? 'isSelected' : '';
      const numViews = MetaUtil.getNumViewsFor(hash);
      s += `<div class="albumItemMeta">`;
      s += `<div class="albumItemViews">${numViews || ''}</div>`;
      s += `<div class="iconButton toggleButton favoriteButton ${favoriteSelectedClass}" data-index="${index}"></div>`;
      s += `</div>`;
    }
		s += `<div class="albumItemContext"><div class="iconButton moreButton" data-index="${index}"></div></div>`;
		s += `</div>`;
		return $(s);
		// also: [$]["name"] is filename; [$]["hash"];
	}

	updateHighlightedTrack = () => {
		if (!this.tracks) {
			return;
		}
    const meta = Model.status.metadata;
    const song = meta['@_song'] || '';
    if (song === this.currentPlayingSong) {
     return;
    }
    this.currentPlayingSong = song;

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
      if (b) {
        $listItem.addClass('selected');
        const last = this.currentPlayingSongAlbumIndex;
        this.currentPlayingSongAlbumIndex = i;
        if (this.currentPlayingSongAlbumIndex == last + 1) {
          // The playing song has just advanced by 1
          // this.nextTrackScrollEffect($listItem)
        }
      } else {
        $listItem.removeClass('selected');
      }
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
    cl(item['@_hash'])
	}

	onItemContextButtonClick(event) {
		event.stopPropagation(); // prevent listitem from responding to same event
		const $button = $(event.currentTarget);
		const index = parseInt($button.attr("data-index"));
    this.contextMenu.show(this.$el, $button, this.album, index);
	}

  onItemFavoriteButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const $button = $(event.currentTarget);
    const index = parseInt($button.attr("data-index"));
    const track = this.tracks[index];
    const hash = track['@_hash'];
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

  onTrackNumViewsUpdated = (e, hash, numViews) => {
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const $item = this.listItems$[i];
      if (track['@_hash'] == hash) {
        $item.find('.albumItemViews').text(numViews);
        break;
      }
    }
  }

  makeStatsText() {
    const duration = this.makeAlbumDurationText();
		const date = this.album['@_date'];
		const genre = this.album['@_genre'];
		const rate = this.album['@_rate'];
		const bits = this.album['@_bits'];
    const filetypeText = this.getFiletypeText();

    let s = '';

		if (date) {
			s = s ? (s + ' | ' + date) : date;
		}
		if (genre) {
			s = s ? (s + ' | ' + genre) : genre;
		}
		if (rate || bits || filetypeText) {
			let s2 = '';
			if (rate) {
				s2 = rate;
			}
			if (bits) {
				s2 = s2 ? (rate + '/' + bits) : bits;
			}
      if (filetypeText) {
        s2 = s2 ? s2 + ' ' + filetypeText : filetypeText;
      }
			s = s ? (s + '<br>' + s2) : s2;
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

  getFiletypeText() {
    // fwiw hqp appears to filter out 'outlier' music files from a given directory,
    // so this logic may not ever come into play.
    let lastGoodSuffix = null;
    for (const item of this.tracks) {
      const suffix = Util.getFileSuffix(item['@_name']);
      if (!suffix) {
        continue; // meh keep going
      }
      if (suffix != lastGoodSuffix) {
        if (!lastGoodSuffix) {
          lastGoodSuffix = suffix;
        } else {
          cl('multiple suffixes detected', suffix, 'vs', lastGoodSuffix);
          return null;
        }
      }
    }
    if (!lastGoodSuffix) {
      return null;
    }
    return lastGoodSuffix.toUpperCase();
  }

  /**
   * Force next-track to be fully visible, aligned to bottom edge,
   * but only if it's currently partially or wholly cropped below $el,
   * and only if the jump is not too large.
   * todo it's off by like (tracknum * 2) px, ugh
   * todo revisit only if we remove scrolleffect on subviews, then simplify
   */
  nextTrackScrollEffect($listItem) {
    const maxDistance = $listItem.outerHeight() * 2;
    const delta = this.getBottomEdgeDistance($listItem);
    if (delta < 0 || delta > maxDistance) {
      return;
    }
    let count = 30; // failsafe lol
    const f = () => {
      // Must be recalculated on every frame due to
      // dynamic sizing of $el due to topbar scroll effect (!)
      const delta = this.getBottomEdgeDistance($listItem);
      if (Math.abs(delta) < 1.0 || count-- <= 0) {
        clearInterval(id);
        return;
      }
      const target = this.$el.scrollTop() + 2; // (delta * 0.35);
      this.$el.scrollTop(target)
    };
    const id = setInterval(f, 16);
  }

  /** Returns the distance a list item's bottom edge is from the bottom edge of the container. */ 
  getBottomEdgeDistance($listItem) {
    const listBottom = this.$el.scrollTop() + this.$el.outerHeight();
    const itemBottom = $listItem[0].offsetTop + $listItem.outerHeight();
    const delta = itemBottom - listBottom;
    return delta;
  }
}
