import AlbumUtil from './album-util.js';
import DataUtil from './data-util.js';
import GroupLabelUtil from './group-label-util.js';
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
  get groupCssClass() { }

  /** 'Abstract' */
  get labelCssClass() { }

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
      const $item = LibraryContentList.makeLibraryIsEmptyItem();
      this.$el.append($item);
      return;
    }
    const isEmpty = (this.albums.length == 0) || (this.groups.length == 0)
        || (this.groups.length == 1 && this.groups[0].length == 0);
    if (isEmpty) {
      const $item = LibraryContentList.makeListIsEmptyItem();
      this.$el.append($item);
      return;
    }

    // Make labels and groups
    for (let i = 0; i < this.groups.length; i++) {

      const label = this.labels[i];
      const group = this.groups[i];

      let $label;
      if (label) {
        $label = GroupLabelUtil.makeLabel(label, this.labelCssClass, group.length);
        this.$el.append($label);
      }

      const $group = $(`<div class="${this.groupCssClass}"></div>`);
      this.populateGroupDiv($group, group);

      if ($label) {
        const s =  this.labelCssClass + ":" + encodeURIComponent(label.substr(0, 100));
        const isCollapsed = Settings.isLibraryGroupCollapsed(s);
        if (isCollapsed) {
          $label.addClass('isCollapsed');
          $group.addClass('isCollapsed');
        }
      }

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

  get areAllLabelsExpanded() {
    const $labels = this.$el.find('.libraryGroupLabel');
    if ($labels.length == 0) {
      return null;
    }
    for (const label of $labels) {
      const isCollapsed = $(label).hasClass('isCollapsed');
      if (isCollapsed) {
        return false;
      }
    }
    return true;
  }

  get areAllLabelsCollapsed() {
    const $labels = this.$el.find('.libraryGroupLabel');
    if ($labels.length == 0) {
      return null;
    }
    for (const label of $labels) {
      const isCollapsed = $(label).hasClass('isCollapsed');
      if (!isCollapsed) {
        return false;
      }
    }
    return true;
  }

  expandAllGroups() {
    const $labels = this.$el.find('.libraryGroupLabel');
    const $groups = this.$el.find('.libraryAlbumGroup');
    $labels.removeClass('isCollapsed');
    $groups.removeClass('isCollapsed');

    const keys = [];
    for (const label of $labels) {
      keys.push(label.getAttribute('data-collapsekey'));
    }
    Settings.setLibraryGroupsCollapsed(keys, false);
  }

  collapseAllGroups() {
    const $labels = this.$el.find('.libraryGroupLabel');
    const $groups = this.$el.find('.libraryAlbumGroup');
    $labels.addClass('isCollapsed');
    $groups.addClass('isCollapsed');

    const keys = [];
    for (const label of $labels) {
      keys.push(label.getAttribute('data-collapsekey'));
    }
    Settings.setLibraryGroupsCollapsed(keys, true);
  }

  static makeLibraryIsEmptyItem() {
    let s;
    s = `<div id="libraryNoneItem" class="libraryItem">`;
    s += `<span class="colorAccent">Library is empty.</span><br><br>`;
    s += `<span class="colorTextLess">Add music to your HQPlayer library<br>`;
    s += `<em>(HQPlayer > File > Library...)</em><br>`;
    s += `and reload page.</span>`;
    s += `</div>`;
    return $(s);
  }

  static makeListIsEmptyItem() {
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
