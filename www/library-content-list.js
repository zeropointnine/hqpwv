import AlbumUtil from './album-util.js';
import DataUtil from './data-util.js';
import LibraryGroupUtil from './library-group-util.js';
import MetaUtil from './meta-util.js';
import Model from './model.js';
import Settings from './settings.js';
import ViewUtil from './view-util.js';

/**
 * 'Abstract' base class for the two content views of LibraryView.
 *
 * Has albums array. And groups/labels arrays (which would be dependent on albums).
 *
 * Subclass must provide enough logic for `populateDom()` to work, basically.
 */
export default class LibraryContentList {

  $el;

  albums;
  labels;
  labelClass;
  groups;

  intersectionObs;

  constructor($el) {
    this.$el = $el;
    const config = { root: $('#libraryView')[0], rootMargin: (window.screen.height * 0.66) + 'px', threshold: 0  };
    this.intersectionObs = new IntersectionObserver(this.onIntersection, config);
    $(document).on('album-favorite-changed', this.onAlbumFavoriteChanged);
  }

  show(type=null, value=null) {
    ViewUtil.setDisplayed(this.$el, true);
  }

  hide() {
    ViewUtil.setDisplayed(this.$el, false);
  }

  /**
   * Sets the albums array.
   * 'Abstract'
   */
  setAlbums(albums) { }

  /** 'Abstract' */
  get groupClassName() { }

  /**
   * Returns a list item DOM element
   * 'Abstract'
   */
  makeListItem(data, index) { }

  /**
   * Removes all children, plus cleanup.
   */
  clear() {
    this.intersectionObs.disconnect();
    this.$el.empty();
  }

  /**
   * Populates dom.
   */
  populateDom() {
    this.clear();

    const isLibraryEmpty = (Model.library.albums.length == 0);
    if (isLibraryEmpty) {
      const $item = this.makeLibraryIsEmptyItem();
      this.$el.append($item);
      return;
    }
    const isEmpty = (this.albums.length == 0) || (this.groups.length == 0)
        || (this.groups.length == 1 && this.groups[0].length == 0);
    if (isEmpty) {
      const $item = this.makeLibraryViewIsEmptyItem();
      this.$el.append($item);
      return;
    }

    // Make labels and groups
    for (let i = 0; i < this.groups.length; i++) {
      const label = this.labels[i];
      const group = this.groups[i];
      const settingsKey = this.labelClass + ":" + encodeURIComponent(label); // NB!
      const isCollapsed = !!Settings.libraryCollapsedGroups[settingsKey];
      if (label) {
        if (!this.labelClass) {
          cl('warning no labelclass');
          return;
        }
        const $label = this.makeLabel(label, this.labelClass, group.length);
        if (isCollapsed) {
          $label.addClass('isCollapsed');
        }
        $label.on('click tap', (e) => this.onLabelClick(e));
        this.$el.append($label);
      }
      const $group = $(`<div class="${this.groupClassName}"></div>`);
      if (isCollapsed) {
        $group.addClass('isCollapsed');
      }
      this.populateGroupDiv($group, group);
      this.$el.append($group);
    }
  }

  // override-able
  populateGroupDiv($group, array) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      const $item = this.makeListItem(item, i);
      $item.on("click tap", e => this.onItemClick(e));
      $item.on("keydown", this.onItemKeydown);
      const img = $item.find('img')[0];
      if (img) {
        this.intersectionObs.observe(img);
      }
      $group.append($item);
    }
  }

  /**
   * Returns a label DOM element or null // todo ?
   */
  makeLabel(label, labelClass, count=0) {
    const settingsKey = labelClass + ":" + encodeURIComponent(label);
    let s = '';
    s += `<div class="libraryGroupLabel ${labelClass}" data-settings="${settingsKey}">`;
    s += `<span class="icon"></span>`;
    s += `<span class="inner">${label}</span>`;
    s += (count > 0) ? `<span class="count">(${count})</span>` : '';
    s += `</div>`;
    return $(s);
  }

  makeLibraryIsEmptyItem() {
    let s;
    s = `<div id="libraryNoneItem" class="libraryItem">`;
    s += `<span class="colorAccent">Library is empty.</span><br><br>`;
    s += `<span class="colorTextLess">Add music to your HQPlayer library<br>`;
    s += `<em>(HQPlayer > File > Library...)</em><br>`;
    s += `and reload page.</span>`;
    s += `</div>`;
    return $(s);
  }

  makeLibraryViewIsEmptyItem() {
    const s = `<div class="libraryItem" id="libraryNoneItem">No items</div>`;
    return $(s);
  }

  /**
   * Has special logic to fade in visible images on first batch only.
   */
  onIntersection = (entries, self) => {

    for (const entry of entries) {
      const $img = $(entry.target);
      if (!entry.isIntersecting) {
        $img.removeAttr('src');
      } else {
        const src = $img.attr('data-src');
        $img.attr('src', src);
      }
    }
  };

  // Must be regular class function to be overridable
  onLabelClick(event) {
    // Toggle class for both label and group
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

    // Update settings
    const label = $label.attr('data-settings');
    if (label) {
      if (shouldCollapse) {
        Settings.addLibraryCollapsedGroup(label);
      } else {
        Settings.removeLibraryCollapsedGroup(label);
      }
    }
  };

  // override-able
  onItemClick(event) {
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

  onAlbumFavoriteChanged = (event, hash, isFavorite) => {
    const selector = `[data-hash="${hash}"]`;
    const $item = this.$el.find(selector);
    if ($item.length > 0) {
      if (isFavorite) {
        $item.addClass('isFavorite');
      } else {
        $item.removeClass('isFavorite');
      }
    }
  };

  /**
   * Standard rect-shaped list item for an album,
   * used for most of the library view lists.
   */
  static makeAlbumListItem(album) {
    const hash = album['@_hash'];
    const imgPath = DataUtil.getAlbumImageUrl(album);
    const artist = album['@_artist'];
    const albumText = album['@_album'];
    const bits = AlbumUtil.getBitrateText(album);
    const isFavoriteClass = MetaUtil.isAlbumFavoriteFor(hash) ? 'isFavorite' : '';

    let s = `<div class="libraryItem ${isFavoriteClass}" data-hash="${hash}">`; /* tabindex="0" */
    s +=      `<div class="libraryItemPicture"><img data-src=${imgPath} /></div>`;
    s +=      `<div class="libraryItemText1">${artist}</div>`;
    s +=      `<div class="libraryItemText2">${albumText}</div>`;
    if (bits) {
      s +=    `<div class="libraryItemBits">${bits}</div>`;
    }
    s +=      `<div class="libraryItemFavorite"></div>`;
    s +=    `</div>`; // todo fault
    const $item = $(s);
    return $item;
  }
}
