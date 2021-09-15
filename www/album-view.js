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
import TopBar from './top-bar.js';
import TopBarUtil from './top-bar-util.js';
import TrackListItemUtil from './track-list-item-util.js';
import Util from'./util.js';
import Values from'./values.js';
import ViewUtil from './view-util.js'

/**
 * Album view containing a header and a list of track list items.
 * todo put top area in its own class
 */
export default class AlbumView extends Subview {

  $pictureHolder;
  $picture;
  $overlayImage;
  $libraryItemImage;
  $artistButton;
  $albumFavoriteButton;
  listItems$;
  contextMenu;
  trackMetaChangeHandler;

  album = null;
  tracks = null; // tracks array of album object

  currentPlayingSong = null;
  currentPlayingSongAlbumIndex = -1;

  constructor() {
    super($("#albumView"));
    this.$pictureHolder = this.$el.find('.albumViewPictureOuter');
    this.$picture = this.$el.find('#albumViewPicture');
    this.$albumFavoriteButton = this.$el.find('#albumFavoriteButton');
    this.$list = this.$el.find('#albumList');
    this.$overlayImage = $('#albumOverlayImage');
    this.$artistButton = this.$el.find('#albumViewArtist');

    this.contextMenu = new AlbumContextMenu($("#albumContextMenu"));
    this.trackMetaChangeHandler = TrackListItemUtil.makeTrackMetaChangeHandler(this.$list);

    this.$artistButton.on('click tap', this.onArtistButton);
    $("#albumPlayNowButton").on("click tap", this.onPlayNowButton);
    $("#albumQueueButton").on("click tap", this.onQueueButton);
    this.$albumFavoriteButton.on('click tap', this.onAlbumFavoriteButton);
    $("#albumCloseButton").on("click tap", () => $(document).trigger('album-view-close-button', this.album, true));
    this.$picture.on('click tap', () => $(document).trigger('album-picture-click', this.$picture));
  }

  show(album, $libraryItem=null) {
    this.$libraryItemImage = $libraryItem ? $libraryItem.find('img') : null;
    this.currentPlayingSongAlbumIndex = -1;

    // nb, list items get generated on every show
    this.populate(album);
    this.$el[0].scrollTop = 0;

    super.show();

    $(document).on('model-status-updated', this.updateHighlightedTrack);
    $(document).on('new-track', this.onNewTrack);
    $(document).on('meta-track-favorite-changed meta-track-incremented', this.trackMetaChangeHandler);

    if (this.$libraryItemImage) {
      this.animateInOverlay(this.onShowComplete);
      this.animateInThis(); // must come second!
    } else {
      this.animateInThis(true);
    }
  }

  animateInThis(isStandalone=false) {

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

    // Fade in + slide up album view
    ViewUtil.animateCss(this.$el,
        () => {
          this.$el.css('opacity', 0);
          this.$el.css("transform", `translateY(${this.$el.height()}px)`);
        },
        () => {
          this.$el.css('opacity', 1);
          this.$el.css('transform', 'translateY(0)');
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

    ViewUtil.setVisible(this.$libraryItemImage, false);
    ViewUtil.setDisplayed(this.$overlayImage, true);
    this.$overlayImage.css('transform', 'translate(0,0) scale(1,1)');
    this.$overlayImage.attr('src', this.$libraryItemImage.attr('src'));

    ViewUtil.animateCss(this.$overlayImage,
        () => ViewUtil.setXYWH(this.$overlayImage, ...rectStart),
        () => this.setTransformUsing(this.$overlayImage, rectStart, rectEnd),
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
    $(document).off('new-track', this.onNewTrack);
    $(document).off('meta-track-favorite-changed meta-track-incremented', this.trackMetaChangeHandler);

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
    this.$overlayImage.css('transform', 'translate(0,0) scale(1,1)');

    ViewUtil.animateCss(this.$overlayImage,
        () => ViewUtil.setXYWH(this.$overlayImage, ...rectStart),
        () => this.setTransformUsing(this.$overlayImage, rectStart, rectEnd),
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
      $item.find(".favoriteButton").on("click tap", e => TrackListItemUtil.onFavoriteButtonClick(e));
      this.listItems$.push($item);
      this.$list.append($item);
    }

		this.currentPlayingSong = undefined;
		this.updateHighlightedTrack();
	}

  updateInfoArea() {

    const imgPath = DataUtil.getAlbumImageUrl(this.album);
    this.$picture.attr('src', imgPath);

    let s = this.album['@_artist'] || '';
    s = s.trim();
    s = s || 'Artist';
    this.$artistButton.html(s);

    s = this.album['@_album'] || '';
    s = s.trim();
    s = s || 'Album';
    $("#albumViewTitle").html(s);

    $("#albumViewStats").html(AlbumUtil.makeAlbumStatsText(this.album));

    AlbumUtil.updateGenreButtons($('#albumViewGenreButtons'), this.album);

    $("#albumViewPath").html(this.album['@_path']);

    MetaUtil.isAlbumFavoriteFor(this.album['@_hash'])
        ? this.$albumFavoriteButton.addClass('isSelected')
        : this.$albumFavoriteButton.removeClass('isSelected')
  }

	makeListItem(index, item) {
		const seconds = parseInt(item['@_length']);
		const duration = seconds ? ` <span class="albumItemDuration">(${Util.durationText(seconds)})</span>` : '';
		const song = item['@_song'];
    const hash = item['@_hash'];
    const isFavorite = MetaUtil.isTrackFavoriteFor(hash);
    const favoriteSelectedClass = isFavorite ? 'isSelected' : '';
    const numViews = MetaUtil.getNumViewsFor(hash);
		let s = '';
    s += `<div class="albumItem" data-index="${index}" data-hash="${hash}">`;
		s += `  <div class="albumItemLeft">${index+1}</div>`;
		s += `  <div class="albumItemMain">${song}${duration}</div>`;
    s += `  <div class="trackItemMeta">`;
    s += `    <div class="numViews">${numViews || ''}</div>`;
    s += `    <div class="iconButton toggleButton favoriteButton ${favoriteSelectedClass}"></div>`;
    s += `  </div>`;
		s += `  <div class="albumItemContext iconButton moreButton" data-index="${index}"></div>`;
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

  onArtistButton = () => {
    let s = this.album['@_artist'] || '';
    s = s.trim();
    if (!s) {
      return;
    }
    $(document).trigger('album-artist-button', s);
  };

	onPlayNowButton = (event) => {
    const commands = Commands.playlistAddUsingAlbumAndIndices(this.album);
    AppUtil.doPlaylistAdds(commands, true, true);
	};

	onQueueButton = (event) => {
    const commands = Commands.playlistAddUsingAlbumAndIndices(this.album);
    AppUtil.doPlaylistAdds(commands);
	};

  onAlbumFavoriteButton = (event) => {
    const hash = this.album['@_hash'];
    const oldValue = MetaUtil.isAlbumFavoriteFor(hash);
    const newValue = !oldValue;
    // update button
    if (newValue) {
      this.$albumFavoriteButton.addClass('isSelected');
    } else {
      this.$albumFavoriteButton.removeClass('isSelected');
    }
    // update model
    MetaUtil.setAlbumFavoriteFor(hash, newValue);
  }

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

  /**
   * Given an abs el whose left/top/width/height are already set to `r1`,
   * set its transform such that its new apparent position and dimensions
   * are that of `r2`.
   *
   * @param $el
   * @param r1 an array with [x,y,w,h]
   * @param r2
   */
  setTransformUsing = ($el, r1, r2) => {
    const dx = r2[0] - r1[0];
    const dy = r2[1] - r1[1];
    const sx = r2[2] / r1[2];
    const sy = r2[3] / r1[3];
    const value = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    $el.css('transform', value);
  } ;

}
