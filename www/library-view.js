import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';
import AlbumUtil from './album-util.js';
import LibraryUtil from './library-util.js';
import LibraryGroupUtil from './library-group-util.js';
import Settings from './settings.js';
import Subview from './subview.js';
import Breakpoint from './breakpoint.js';
import DataUtil from './data-util.js';
import Model from './model.js';
import Service from './service.js';
import LibraryOptionsView from './library-options-view.js';

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
  /** Parallel array of labels that go with each group. */
  labels;

  constructor() {
    super($("#libraryView"));
  	this.$content = this.$el.find("#libraryContent");
    this.$itemCount = this.$el.find('#libraryNumbers');
    this.$spinner = this.$el.find('#librarySpinner');

    this.optionsView = new LibraryOptionsView(this.$el.find("#libraryOptionsView"));

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
    const a = Model.library.albums;
    this.albums = LibraryUtil.makeFilteredAlbumsArray(a);

    // Make groups
    const groupType = Settings.libraryGroupType;
    const o = LibraryGroupUtil.makeGroups(this.albums, groupType);
    this.groups = o['groups'];
    this.labels = o['labels'];

    // Sort each group
    LibraryGroupUtil.sortAlbumsWithinGroups(this.groups);

    // Populate list
    this.$content.empty();
    const isLibraryEmpty = (Model.library.albums.length == 0);
    const isLibraryViewEmpty = (this.albums.length == 0) || (this.groups.length == 0)
        || (this.groups.length == 1 && this.groups[0].length == 0);
    if (isLibraryEmpty) {
      const $item = this.makeLibraryIsEmptyItem();
      this.$content.append($item);
    } else if (isLibraryViewEmpty) {
      const $item = this.makeLibraryViewIsEmptyItem();
      this.$content.append($item);
    } else {
      for (let i = 0; i < this.groups.length; i++) {
        const group = this.groups[i];
        const label = this.labels[i];
        this.appendGroupDivs(group, label, groupType);
      }
    }

    this.$itemCount.text(`(${this.albums.length}/${Model.library.albums.length})`);
    $(document).trigger('library-view-populated', this.albums.length);

    const duration = new Date().getTime() - startTime;
    cl(`init - lib populate ${duration}ms`);
	}

  /**
   * Makes a group DOM element and its list items.
   */
  appendGroupDivs(group, label=null, labelType=null) {

    const isCollapsed = Settings.libraryCollapsedGroups.includes(label);

    if (label) {
      const $label = this.makeGroupLabel(label, labelType, group.length, isCollapsed);
      this.$content.append($label);
    }

    const $group = $(`<div class="libraryGroup ${isCollapsed ? 'isCollapsed' : ''}"></div>`);

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

  makeGroupLabel(label, labelType, numItems, isCollapsed) {

    let iconClass;
    switch (labelType) {
      case 'path':
        iconClass = 'folderIcon';
        break;
      case 'bitrate':
        iconClass = 'waveIcon';
        break;
      case 'genre':
        iconClass = 'genreIcon';
        break;
    }
    const iconSpan = iconClass ? `<span class="icon ${iconClass}"></span>` : '';
    const textSpan = `<span class="inner">${label}</span>`;

    let s = '';
    s += `<div class="libraryGroupLabel ${isCollapsed ? 'isCollapsed' : ''}">`;
    s += `${iconSpan}${textSpan}`;
    s += `<span class="count">(${numItems})</span>`;
    s += `</div>`;

    const $label = $(s);
    $label.on('click tap', this.onGroupLabelClick);
    return $label;
  }

  makeListItem(album) {
    const hash = album['@_hash'];
    const imgPath = DataUtil.getAlbumImageUrl(album);
    const artist = album['@_artist'];
    const albumText = album['@_album'];
    const bits = AlbumUtil.getBitrateText(album);

    let s = `<div class="libraryItem" data-hash="${hash}">`; /* tabindex="0" */
    s +=      `<div class="libraryItemPicture"><img data-src=${imgPath} /></div>`;
    s +=      `<div class="libraryItemText1">${artist}</div>`;
    s +=      `<div class="libraryItemText2">${albumText}</div>`;
    if (bits) {
      s +=    `<div class="libraryItemBits">${bits}</div>`;
    }
    s +=    `</div>`; // todo fault
    const $item = $(s);
    return $item;
  }

  makeLibraryIsEmptyItem() {
    const s = `<div id="libraryNoneItem">No items</div>`;
    return $(s);
  }

  makeLibraryViewIsEmptyItem() {
    let s;
    s = `<div id="libraryNoneItem">`;
    s += `<span class="colorAccent">Library is empty.</span><br><br>`;
    s += `<span class="colorTextLess">Add music to your HQPlayer library<br>`;
    s += `<em>(HQPlayer > File > Library...)</em><br>`;
    s += `and reload page.</span>`;
    s += `</div>`;
    return $(s);
  }

  onItemClick = (event) => {
    const $item = $(event.currentTarget);
		const hash = $item.attr("data-hash");
    const album = Model.library.getAlbumByAlbumHash(hash);
		$(document).trigger('library-item-click', [album, $item]);
	};

  onItemKeydown = (event) => {
    if (event.keyCode == 13) {
      this.onItemClick(event);
    }
  };

  onGroupLabelClick = (event) => {
    const $label = $(event.currentTarget);
    const $group = $label.next();
    const shouldCollapse = !$label.hasClass('isCollapsed');
    if (shouldCollapse) {
      $label.addClass('isCollapsed');
      $group.addClass('isCollapsed');
    } else {
      $label.removeClass('isCollapsed');
      $group.removeClass('isCollapsed');
    }

    // update settings
    const label = $label.find('.inner').text(); // ew
    const index = Settings.libraryCollapsedGroups.indexOf(label);
    if (shouldCollapse) {
      if (index == -1) {
        Settings.libraryCollapsedGroups.push(label);
      }
    } else {
      if (index > -1) {
        Settings.libraryCollapsedGroups.splice(index, 1);
      }
    }
    Settings.commitLibraryCollapsedGroups();
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
