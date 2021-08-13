import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import LibraryUtil from './library-util.js';
import LibraryGroupUtil from './library-group-util.js';
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

  $content;
  $itemCount;
  $spinner;
  optionsView;

  intersectionObs;

  /** Filtered albums. */
  albums;

  /** Array of album arrays. */
  groups;
  groupHtmlLabels;

  constructor() {
    super($("#libraryView"));
  	this.$content = this.$el.find("#libraryContent");
    this.$itemCount = this.$el.find('#libraryNumbers');
    this.$spinner = this.$el.find('#librarySpinner');
  	this.updateListWidth();

    this.optionsView = new LibraryOptionsView(this.$el.find("#libraryOptionsView"));

    $(document).on('debounced-window-resize', e => this.updateListWidth());
    $(document).on('init-images-finished', e => this.forceReloadImages());

    const config = { root: this.$el[0], rootMargin: (window.screen.height * 0.66) + 'px', threshold: 0  };
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

    // Make filtered albums array
    const a = Model.library.array;
    this.albums = LibraryUtil.makeFilteredAlbumsArray(a);
    LibraryUtil.sortAlbums(this.albums, Settings.librarySortType);

    const o = LibraryGroupUtil.makeGroups(this.albums);
    this.groups = o['groups'];
    this.groupHtmlLabels = o['labels'];

    this.$content.empty();

    if (this.albums.length == 0) {
      const $none = this.makeNoneItem();
      this.$content.append($none);
    } else {
      for (let i = 0; i < this.groups.length; i++) {
        const group = this.groups[i];
        const groupHtmlLabel = this.groupHtmlLabels[i];
        this.appendGroupDiv(group, groupHtmlLabel);
      }
    }

    this.$itemCount.text(`(${this.albums.length}/${Model.library.array.length})`);
    this.updateListWidth();
    $(document).trigger('library-view-populated', this.albums.length);

    const duration = new Date().getTime() - startTime;
    cl(`init - lib populate ${duration}ms`);
	}

  /**
   * Makes a group DOM element and its list items.
   */
  appendGroupDiv(group, htmlLabel) {

    if (htmlLabel) {
      const $label = $(`<div class="libraryGroupLabel">${htmlLabel}</div>`);
      this.$content.append($label);
    }

    const $group = $(`<div class="libraryGroup"></div>`);
    for (let i = 0; i < group.length; i++) {
      const item = group[i];
      const $item = this.makeListItem(item);
      $item.on("click tap", this.onItemClick);
      $item.on("keydown", this.onItemKeydown);
      const img = $item.find('img')[0];
      this.intersectionObs.observe(img);
      $group.append($item);
    }
    this.$content.append($group);
  }

  makeListItem(album) {
    const hash = album['@_hash'];
    const imgPath = ModelUtil.getAlbumImageUrl(album);
    const artist = album['@_artist'];
    const albumText = album['@_album'];
    const bits = Model.makeBitrateDisplayText(album);

    let s = `<div class="libraryItem" data-hash="${hash}">`; /* tabindex="0" */
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
    if (Model.library.array && Model.library.array.length > 0) {
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
		this.$content.width(inner + "px");
	}

	onItemClick = (event) => {
    const $item = $(event.currentTarget);
		const hash = $item.attr("data-hash");
    const album = Model.library.getItemByHash(hash);
		$(document).trigger('library-item-click', [album, $item]);
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
