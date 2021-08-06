import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import LibraryUtil from './library-util.js';
import Settings from './settings.js';
import Subview from './subview.js';
import Breakpoint from './breakpoint.js';
import ModelUtil from './model-util.js';
import Model from './model.js';
import Service from './service.js';
import LibraryOptionsView from './library-options-view.js';

// Must match css (.libraryItem width + marginLeft + marginRight)
const ITEM_SPAN_H_MOBILE = 144 + 4 + 4;
const ITEM_SPAN_H_TABLET = 224 + 8 + 8;
const ITEM_SPAN_H_DESKTOP = 240 + 8 + 8;
const MAX_COLS = 6;

/**
 * Library view containing a list of albums.
 * Is always visible under any other main views.
 */
export default class LibraryView extends Subview {

  $list;
  $itemCount;
  $spinner;
  optionsView;

  intersectionObs;
  albums;

  constructor() {
    super($("#libraryView"));
  	this.$list = this.$el.find("#libraryList");
    this.$itemCount = this.$el.find('#libraryNumbers');
    this.$spinner = this.$el.find('#librarySpinner');
  	this.updateListWidth();

    this.optionsView = new LibraryOptionsView(this.$el.find("#libraryOptionsView"));

    $(document).on('debounced-window-resize', e => this.updateListWidth());
    $(document).on('init-images-finished', e => this.forceReloadImages());

    const config = { root: this.$el[0], rootMargin: '200px', threshold: 0  };
    this.intersectionObs = new IntersectionObserver(this.onIntersection, config);
  }

  setSpinnerState(b) {
    if (b) {
      this.$el.addClass('isDisabled');
      ViewUtil.setDisplayed(this.$spinner, true);
      this.$spinner.css('opacity', 1);
    } else {
      this.$el.removeClass('isDisabled');
      ViewUtil.setDisplayed(this.$spinner, false);
    }
  }

  update() {
    this.setSpinnerState(false);

    const startTime = new Date().getTime();
		if (this.intersectionObs) {
      this.intersectionObs.disconnect();
    }

    // Prep the albums array
    const a = Model.libraryData ? [...Model.libraryData] : [];
    this.albums = LibraryUtil.makeFilteredAlbumsArray(a);
    LibraryUtil.sortAlbums(this.albums, Settings.librarySortType);

    this.$list.empty();

    if (this.albums.length == 0) {
      const $none = this.makeNoneItem();
      this.$list.append($none);
    } else {
      for (let i = 0; i < this.albums.length; i++) {
        const item = this.albums[i];
        const $item = this.makeListItem(i, item);
        $item.on("click tap", this.onItemClick);
        $item.on("keydown", this.onItemKeydown);
        const img = $item.find('img')[0];
        this.intersectionObs.observe(img)
        this.$list.append($item);
      }
    }
		this.updateListWidth();


    this.$itemCount.text(`(${this.albums.length}/${Model.libraryData.length})`);

    const duration = new Date().getTime() - startTime;
    cl(`init - lib populate time ${duration}ms`);
	}

  makeListItem(index, album) {
    const imgPath = ModelUtil.getAlbumImageUrl(album);
    const artist = album['@_artist'];
    const albumText = album['@_album'];
    const bits = Model.makeBitrateDisplayText(album);

    let s = `<div class="libraryItem" data-index="${index}" tabindex="0">`;
    s +=      `<img class="libraryItemPicture" data-src=${imgPath} />`;
    s +=      `<div class="libraryItemText1">${artist}</div>`;
    s +=      `<div class="libraryItemText2">${albumText}</div>`;
    if (bits) {
      s +=    `<div class="libraryItemBits">${bits}</div>`;
    }
    s +=    `</div>`; // todo fault
    const $item = $(s);
    return $item;
  }

  makeNoneItem() {
    let s;
    if (Model.libraryData && Model.libraryData.length > 0) {
      s = `<div id="libraryNoneItem">No items</div>`;
    } else {
      s = `<div id="libraryNoneItem">`;
      s += `<span class="colorAccent">Library is empty.</span><br><br>`;
      s += `<span class="colorTextLess">Add music to your HQPlayer library<br>`;
      s += `<em>(HQPlayer > File > Library...)</em><br>`;
      s += `and reload page.</span>`;
      s += `</div>`;
    }
    return $(s);
  }

  /**
   * Sets width of container to some multiple of the span of an item.
   * Allows content to remain horizontally centered.
   */
	updateListWidth() {
    const outer = this.$el.width();
    let itemSpanH;
    if (Breakpoint.isMobile) {
      itemSpanH = ITEM_SPAN_H_MOBILE;
    } else if (Breakpoint.isTablet) {
      itemSpanH = ITEM_SPAN_H_TABLET;
    } else {
      itemSpanH = ITEM_SPAN_H_DESKTOP;
    }
    let multiple = Math.floor(outer / itemSpanH);
    multiple = Math.min(multiple, MAX_COLS);
		const inner = multiple * itemSpanH;
		this.$list.width(inner + "px");
	}

	onItemClick = (event) => {
		const index = $(event.currentTarget).attr("data-index");
		const album = this.albums[index];
		$(document).trigger('library-item-click', album);
	};

  onItemKeydown = (event) => {
    if (event.keyCode == 13) {
      this.onItemClick(event);
    }
  };

	onIntersection = (entries, self) => {
		for (const entry of entries) {
			const $img = $(entry.target);
			if (entry.isIntersecting) {
				const src = $img.attr('data-src');
				$img.attr('src', src);
			} else {
				$img.removeAttr('src');
			}
		}
	};
}
