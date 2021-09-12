import AppUtil from './app-util.js';
import Commands from './commands.js';
import LoadPlaylistContextMenu from './load-playlist-context-menu.js';
import MetaUtil from './meta-util.js';
import ModalPointerUtil from './modal-pointer-util.js';
import Model from './model.js';
import DataUtil from './data-util.js';
import PlaylistVo from './playlist-vo.js';
import Service from './service.js';
import Subview from './subview.js';
import ToastView from './toast-view.js';
import Util from './util.js';
import Values from './values.js';
import ViewUtil from './view-util.js';

/**
 * Shows list of custom playlists.
 */
export default class LoadPlaylistView  extends Subview {

  $customList;
  $hqpList;

  items;
  contextMenu;

  customPlaylistPaths;
  hqpPlaylistItems;

  constructor($el) {
  	super($el);
  	this.$customList = this.$el.find("#loadCustomList");
    this.$hqpList = this.$el.find("#loadHqpList");
  	this.$el.find("#loadCloseButton").on("click tap", () => $(document).trigger('load-playlist-close'));
    this.contextMenu = new LoadPlaylistContextMenu();
	}

  onShow() {
    $(document).on('custom-playlists-changed', this.onMetaPlaylistsChanged);
    this.populate();
  }

  onHide() {
    $(document).off('custom-playlists-changed', this.onMetaPlaylistsChanged);
  }

  populate() {
    this.fetchCustomPlaylistPaths((isSuccess) => {
      if (!isSuccess) {
        ToastView.show(`<span class="colorAccent">Couldn't get custom playlists</span>`); // todo continue
      } else {
        this.populateCustomList();
        this.populateHqpList();
      }
    });
  }
  
  populateCustomList() {
    this.$customList.empty();
    if (Values.areOnDifferentMachines) {
      this.$customList.append(this.makeFyiCustomItem());
      return;
    }
    if (this.customPlaylistPaths.length == 0) {
      this.$customList.append(this.makeNonItem());
      return;
    } 
    for (let i = 0; i < this.customPlaylistPaths.length; i++) {
      const playlist = this.customPlaylistPaths[i];
      const $item = this.makeCustomListItem(playlist, i);
      this.$customList.append($item);
      $item.on('click tap', this.onCustomItemClick);
      $item.find(".moreButton").on("click tap", e => this.onItemContextButtonClick(e));
    }
  }

	makeCustomListItem(customPlaylistPath, index) {
    let name = Util.getFilenameFromPath(customPlaylistPath);
    name = name.replace('.m3u8', '');
    let s = '';
    s += `<div class="trackItem loadItem" data-index="${index}">`;
    s += `<span>${name}</span>`;
    s += `<div class="iconButton moreButton" data-index="${index}"></div>`;
    s += `</div>`;
    return $(s);
	}

  populateHqpList() {

    this.hqpPlaylistItems = [...Model.library.hqpPlaylistItems];

    this.$hqpList.empty();
    if (this.hqpPlaylistItems.length == 0) {
      this.$hqpList.append(this.makeNonItem());
      return;
    }
    for (let i = 0; i < this.hqpPlaylistItems.length; i++) {
      const item = this.hqpPlaylistItems[i];
      const $item = this.makeHqpListItem(item, i);
      this.$hqpList.append($item);
      $item.on('click tap', this.onHqpItemClick);
      $item.find(".moreButton").on("click tap", e => this.onItemContextButtonClick(e));
    }
  }

  makeHqpListItem(hqpPlaylistItem, index) {
    let s = '';
    s += `<div class="trackItem loadItem" data-index="${index}" style="padding-right:12px; overflow:hidden;">`;
    s += `<span>${hqpPlaylistItem['@_album']}</span>`;
    s += `</div>`;
    return $(s);
  }

  makeNonItem() {
    const s = `<div class="trackItem loadItem loadNonItem">No playlists</div>`;
    return $(s);
  }

  makeFyiCustomItem() {
    const s = `<div class="trackItem loadItem loadNonItem loadFyiItem">HQPWV and HQPlayer must be running on the same machine for custom playlists to be enabled.</div>`;
    return $(s);
  }

	onCustomItemClick = (e) => {
    const $item = $(e.currentTarget);
    const index = parseInt($item.attr('data-index'));
    const path = this.customPlaylistPaths[index];
    this.doPlaylistLoad(path);
  };

  onHqpItemClick = (e) => {
    const $item = $(e.currentTarget);
    const index = parseInt($item.attr('data-index'));
    const item = this.hqpPlaylistItems[index];
    const path = item['@_path'];
    this.doPlaylistLoad(path);
  };

  // ---

  doPlaylistLoad(path) {
    ToastView.show(`Loading playlist`, 0);
    $(document).trigger('disable-user-input');

    const onGetTransport = (data) => {
      if (data['GetTransport'] == undefined || data['GetTransport']['@_value'] == undefined) {
        cl('warning bad value', data);
        ToastView.show(`<span class="colorAccent">Couldn't load playlist</span>`);
      } else {
        let transport = data['GetTransport']['@_value'];
        if (transport == 0) {
          // Can happen when playlist is empty;
          // 240 is what it otherwise returns based on personal testing
          cl('warning value is 0, will use 240');
          transport = 240;
        }
        this.doPlaylistLoadContinued(path, transport);
      }
    };

    // no idea what this but info is needed for <SetTransport>
    Service.queueCommandFront(Commands.getTransport(), onGetTransport);
  }

  doPlaylistLoadContinued(path, transport) {
    const onPlaylistLoaded = (data) => {
      ToastView.hide();
      $(document).trigger('enable-user-input');

      // done:
      if (!DataUtil.isResultOk(data)) {
        ToastView.show(`<span class="colorAccent">Couldn't load playlist</span>`);
      } else {
        $(document).trigger('load-playlist-close');
      }
    };
    const command = Commands.setTransport(transport, path);
    Service.queueCommandFront(command, onPlaylistLoaded);
  }

  onItemContextButtonClick(event) {
    event.stopPropagation(); // prevent listitem from responding to same event
    const $button = $(event.currentTarget);
    const index = parseInt($button.attr("data-index"));
    const playlistUri = this.customPlaylistPaths[index];
    this.contextMenu.show(this.$el, $button, playlistUri, index);
  }

  onMetaPlaylistsChanged = () => {
    this.contextMenu.hide();
    this.populate();
  };

  // ---

  fetchCustomPlaylistPaths(resultCallback) {
    const onSuccess = (data, textStatus, jqXHR) => {
      if (!!data['error']) {
        cl('warning', data['error']);
        this.customPlaylistPaths = [];
        resultCallback(false);
        return;
      }
      this.customPlaylistPaths = data;
      resultCallback(true);
    };
    const onError = (e) => {
      cl('warning', e);
      this.customPlaylistPaths = [];
      resultCallback(false);
    };
    const url = `${Values.PLAYLIST_ENDPOINT}?getPlaylists`;
    $.ajax( { url: url, error: onError, success: onSuccess } );
  }
}
