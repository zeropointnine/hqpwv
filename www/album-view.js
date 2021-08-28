import AlbumContextMenu from './album-context-menu.js';
import AlbumUtil from './album-util.js'
import App from'./app.js';
import AppUtil from './app-util.js'
import Commands from './commands.js';
import DataUtil from './data-util.js';
import MetaUtil from './meta-util.js'
import Model from './model.js';
import Service from './service.js';
import Subview from'./subview.js';
import Util from'./util.js';
import Values from'./values.js';
import ViewUtil from './view-util.js'

/**
 * Album view containing a header and a list of track list items.
 */
export default class AlbumView extends Subview {

  $pictureHolder;
  $picture;
  $list;
  $overlayImage;
  $libraryItemImage;
  listItems$;
  contextMenu;

  album = null; // album object
  tracks = null; // tracks array of album object

  currentPlayingSong = null;
  currentPlayingSongAlbumIndex = -1;

  constructor() {
    super($("#albumView"));
    this.$pictureHolder = $(".albumViewPictureOuter");
    this.$picture = $("#albumViewPicture");
    this.$list = this.$el.find("#albumList");
    this.$overlayImage = $('#albumOverlayImage');

    this.contextMenu = new AlbumContextMenu($("#albumContextMenu"));

    $("#albumPlayNowButton").on("click tap", this.onPlayNowButton);
    $("#albumQueueButton").on("click tap", this.onQueueButton);
    $("#albumCloseButton").on("click tap", () => $(document).trigger('album-view-close-button', this.album, true));
    this.$picture.on('click tap', () => $(document).trigger('album-picture-click', this.$picture));
  }

  show(album, $libraryItem=null) {

    this.$libraryItemImage = $libraryItem ? $libraryItem.find('img') : null;
    this.currentPlayingSongAlbumIndex = -1;

    this.populate(album);
    this.$el[0].scrollTop = 0;

    super.show();

    $(document).on('model-status-updated', this.updateHighlightedTrack);
    $(document).on('meta-track-incremented', this.onMetaTrackIncremented);
    $(document).on('new-track', this.onNewTrack);

    if (this.$libraryItemImage) {
      this.animateInOverlay(this.onShowComplete);
      this.animateInThis(); // must come second!
    } else {
      this.animateInThis(true);
    }
  }

  animateInThis(isStandalone=false) {
    // slide up album view
    if (isStandalone) {
      ViewUtil.setVisible(this.$picture, '');
    } else {
      ViewUtil.setVisible(this.$picture, false);
      // Fade in the picture holder (looks better)
      ViewUtil.animateCss(this.$pictureHolder,
          () => this.$pictureHolder.css('opacity', 0),
          () => this.$pictureHolder.css('opacity', 1));
    }

    this.$el.addClass('animIn');

    ViewUtil.animateCss(this.$el,
        () => {
          this.$el.css("top", this.$el.height() / 1 + "px");
          this.$el.css('opacity', 0);
        },
        () => {
          this.$el.css('top', '0px');
          this.$el.css('opacity', 1);
        },
        () => {
          this.$el.removeClass('animIn');
          if (isStandalone) {
            this.onShowComplete();
          }
        });
  }

  animateInOverlay() {
    // get overlay image's start and end rects
    const rectStart = this.getLibraryItemImageRect();
    ViewUtil.setCssSync(this.$el, () => this.$el.css('top', '0')); // bc view must be in its end-state to get rectEnd
    const rectEnd = this.getAlbumViewImageRect();

    // animate overlay image
    ViewUtil.setVisible(this.$libraryItemImage, false);
    ViewUtil.setDisplayed(this.$overlayImage, true);
    this.$overlayImage.removeClass('animOut');
    this.$overlayImage.attr('src', this.$libraryItemImage.attr('src'));
    ViewUtil.animateCss(this.$overlayImage,
        () => {
          ViewUtil.setXYWH(this.$overlayImage, ...rectStart);
        },
        () => {
          ViewUtil.setXYWH(this.$overlayImage, ...rectEnd);
        },
        () => {
          ViewUtil.setVisible(this.$libraryItemImage, '');
          ViewUtil.setVisible(this.$picture, '');
          this.onShowComplete();
        });
  }

  onShowComplete = () => {
    ViewUtil.setDisplayed(this.$overlayImage, false);
    $(document).trigger('enable-user-input');
  };

  hide() {
    this.contextMenu.hide();
    $(document).off('model-status-updated', this.updateHighlightedTrack);
    $(document).off('meta-track-incremented', this.onMetaTrackIncremented);
    $(document).off('new-track', this.onNewTrack);

    // do normal fadeout of album view
    super.hide();

    if (this.$libraryItemImage) {
      this.animateOutOverlay();
    } else {
      $(document).trigger('enable-user-input');
    }
  }

  animateOutOverlay() {
    // get overlay image's start and end rects
    const rectStart = this.getAlbumViewImageRect();
    const rectEnd = this.getLibraryItemImageRect();

    const rectEndY = rectEnd[1];
    const rectEndH = rectEnd[3];
    const inBounds = (rectEndY >= 0 - rectEndH && rectEndY <= this.$el.height() + rectEndH);
    if (!inBounds) {
      // target is out of bounds; note too that y/h can be NaN in this case
      $(document).trigger('enable-user-input');
      return;
    }

    // animate overlay image
    ViewUtil.setVisible(this.$picture, false);
    ViewUtil.setVisible(this.$libraryItemImage, false);
    ViewUtil.setDisplayed(this.$overlayImage, true);
    this.$overlayImage.addClass('animOut');

    ViewUtil.animateCss(this.$overlayImage,
        () => { ViewUtil.setXYWH(this.$overlayImage, ...rectStart); },
        () => { ViewUtil.setXYWH(this.$overlayImage, ...rectEnd); },
        this.animateOutOverlayContinued);
  }

  animateOutOverlayContinued = () => {
    ViewUtil.setDisplayed(this.$overlayImage, false);
    ViewUtil.setVisible(this.$picture, '');
    ViewUtil.setVisible(this.$libraryItemImage, true);
    $(document).trigger('enable-user-input');
  };
  
  populate(album) {
  	this.album = album;
  	this.tracks = AlbumUtil.getTracksOf(this.album);

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
    const imgPath = DataUtil.getAlbumImageUrl(this.album);
    this.$picture.attr('src', imgPath);

    $("#albumViewTitle").html(this.album['@_album']);
    $("#albumViewArtist").html(this.album['@_artist']);
    $("#albumViewStats").html(AlbumUtil.makeAlbumStatsText(this.album));
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

    const isInAlbum = DataUtil.doesAlbumContainPlayingSong(this.album);

    for (let i = 0; i < this.tracks.length; i++) {
			const track = this.tracks[i];
			let b;
      if (!isInAlbum) {
        b = false;
      } else {
        b = DataUtil.doesAlbumSongEqualPlayingSong(this.album, track);
      }
			const $listItem = this.listItems$[i];
      if (b) {
        $listItem.addClass('selected');
      } else {
        $listItem.removeClass('selected');
      }
		}
	};

	onPlayNowButton = (event) => {
    const commands = Commands.playlistAddUsingAlbumAndIndices(this.album);
    AppUtil.doPlaylistAdds(commands, true, true);
	};

	onQueueButton = (event) => {
    const commands = Commands.playlistAddUsingAlbumAndIndices(this.album);
    AppUtil.doPlaylistAdds(commands);
	};

	onItemClick(event) {
		const index = $(event.currentTarget).attr("data-index");
		const item = this.tracks[index];
    // ...
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

  onMetaTrackIncremented = (e, hash, numViews) => {
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const $item = this.listItems$[i];
      if (track['@_hash'] == hash) {
        $item.find('.albumItemViews').text(numViews);
        break;
      }
    }
  };

  onNewTrack = (e, currentUri, lastUri) => {
    if (App.instance.getTopSubview() != this) {
      return;
    }
    const currentTrack = Model.library.getTrackByUri(currentUri);
    const currentAlbumIndex = this.tracks.indexOf(currentTrack);
    const lastTrack = Model.library.getTrackByUri(lastUri);
    const lastAlbumIndex = this.tracks.indexOf(lastTrack);
    if (currentAlbumIndex > -1) {
      if (currentAlbumIndex > lastAlbumIndex) {
        const $listItem = this.listItems$[currentAlbumIndex];
        Util.autoScrollListItem($listItem, this.$el);
      }
    }
  };

  getLibraryItemImageRect() {
    const r1 = this.$libraryItemImage[0].getBoundingClientRect();
    const r2 = this.$el[0].getBoundingClientRect();

    // Translation-adjusted bounding box of library list item's album image.
    let imgX = r1.x - r2.x;
    let imgY = r1.y - r2.y;
    let imgW = r1.width;
    let imgH = r1.height;

    // Adjust for object-fit: cover
    const naturalW = this.$libraryItemImage[0].naturalWidth;
    const naturalH = this.$libraryItemImage[0].naturalHeight;
    const naturalAr = (naturalW & naturalH) ? naturalW / naturalH : 1;

    let overlayX, overlayY, overlayW, overlayH;
    if (naturalAr > imgW / imgH) {
      overlayW = imgW * (naturalAr);
      overlayH = imgH;
      overlayY = imgY;
      overlayX = imgX - (overlayW - imgW) / 2;
    } else {
      overlayH = imgH * (1 / naturalAr);
      overlayW = imgW;
      overlayX = imgX;
      overlayY = imgY - (overlayH - imgH) / 2;
    }
    return [overlayX, overlayY, overlayW, overlayH];
  }

  getAlbumViewImageRect() {

    const r1 = this.$picture[0].getBoundingClientRect(); // rem, for anim-in, album view must be in its end-state!
    const r2 = this.$el[0].getBoundingClientRect();

    // Translation-adjusted bounding box of album view's album image.
    let boxX = r1.x - r2.x;
    let boxY = r1.y - r2.y;
    let boxW = r1.width;
    let boxH = r1.height;

    // Adjust for object-fit: _contain_ this time
    const naturalW = this.$libraryItemImage[0].naturalWidth;
    const naturalH = this.$libraryItemImage[0].naturalHeight;
    const naturalAr = (naturalW && naturalH) ? naturalW / naturalH : 1;

    let overlayX, overlayY, overlayW, overlayH;
    if (naturalAr > boxW / boxH) {
      // cl('image content has wider aspect ratio')
      overlayW = boxW;
      overlayH = boxW * (1/ naturalAr);
    } else {
      // cl('image content has narrower aspect ratio')
      overlayH = boxH;
      overlayW = boxH * naturalAr;
    }
    overlayX = boxX + (boxW - overlayW) / 2;
    overlayY = boxY + (boxH - overlayH) / 2;

    return [overlayX, overlayY, overlayW, overlayH];
  }
}
