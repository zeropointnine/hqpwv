import AlbumUtil from './album-util.js';
import DataUtil from './data-util.js';
import LibraryGroupUtil from './library-group-util.js';
import Model from './model.js';
import Settings from './settings.js';

/**
 * 'Abstract' base class for the two swappable content views of LibraryView.
 *
 * Has albums array. And groups/labels arrays (which would be dependent on albums).
 *
 * Subclass must provide enough logic for `makeDom()` to work, basically.
 */
export default class LibraryContentView {

  $el;

  albums;
  labels;
  groups;

  intersectionObs;

  constructor($el) {
    this.$el = $el;
    const config = { root: $('#libraryView')[0], rootMargin: (window.screen.height * 0.66) + 'px', threshold: 0  };
    this.intersectionObs = new IntersectionObserver(this.onIntersection, config);
  }

  /**
   * Sets the albums array.
   * 'Abstract'
   */
  setAlbums(albums) { }

  /**
   * Returns a label DOM element
   * 'Abstract'
   */
  makeLabel(label, group) { }

  /**
   * Returns a list item DOM element
   * 'Abstract'
   */
  makeListItem(data, index) { }

  /**
   * Removes all children, plus cleanup.
   */
  clear() {
    if (this.intersectionObs) {
      this.intersectionObs.disconnect();
    }
    this.$el.empty();
  }

  /**
   * Populates dom.
   */
  makeDom() {
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

    for (let i = 0; i < this.groups.length; i++) {
      const label = this.labels[i];
      const group = this.groups[i];
      const isCollapsed = !!Settings.libraryCollapsedGroups[encodeURIComponent(label)]; // NB!
      if (label) {
        const $label = this.makeLabel(label, group);
        if (isCollapsed) {
          $label.addClass('isCollapsed');
        }
        $label.on('click tap', (e) => this.onLabelClick(e));
        this.$el.append($label);
      }
      const $group = $(`<div class="libraryGroup"></div>`);
      if (isCollapsed) {
        $group.addClass('isCollapsed');
      }
      this.addItemsToGroupDiv($group, group);
      this.$el.append($group);
    }
  }

  addItemsToGroupDiv($group, group) {
    for (let i = 0; i < group.length; i++) {
      const item = group[i];
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

  makeLibraryIsEmptyItem() {
    let s;
    s = `<div id="libraryNoneItem">`;
    s += `<span class="colorAccent">Library is empty.</span><br><br>`;
    s += `<span class="colorTextLess">Add music to your HQPlayer library<br>`;
    s += `<em>(HQPlayer > File > Library...)</em><br>`;
    s += `and reload page.</span>`;
    s += `</div>`;
    return $(s);
  }

  makeLibraryViewIsEmptyItem() {
    const s = `<div id="libraryNoneItem">No items</div>`;
    return $(s);
  }

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
    const label = $label.attr('data-label');
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

  /** 
   * Returns a label list item.
   */
  static makeLabel(label, iconClass=null, count=0) {
    const iconSpan = iconClass ? `<span class="icon ${iconClass}"></span>` : '';
    const textSpan = `<span class="inner">${label}</span>`;
    const countSpan = (count > 0) ? `<span class="count">(${count})</span>` : '';
    let s = '';
    s += `<div class="libraryGroupLabel" data-label="${encodeURIComponent(label)}">`;
    s += `${iconSpan}${textSpan}${countSpan}`;
    s += `</div>`;
    const $label = $(s);
    return $label;
  }
}
