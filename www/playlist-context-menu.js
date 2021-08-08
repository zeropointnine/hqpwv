import ContextMenu from './context-menu.js';
import ViewUtil from './view-util.js';
import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';

/**
 *
 */
export default class PlaylistContextMenu extends ContextMenu {

  $upItem;
  $downItem;
  $removeItem;
  $albumItem;

  index = -1;
  matchingLibraryItem = null;

  constructor() {
    super($("#playlistContextMenu"));

    this.$upItem = this.$el.find("#playlistContextUp");
    this.$downItem = this.$el.find("#playlistContextDown");
    this.$removeItem = this.$el.find("#playlistContextRemove");
    this.$albumItem = this.$el.find("#playlistContextAlbum");

    this.$upItem.on("click tap", e => {
      Service.queueCommandsFront([
          Commands.playlistMoveUp(this.index + 1), Commands.playlistGet()]); // rem, 1-indexed 
    });

    this.$downItem.on("click tap", e => {
      Service.queueCommandsFront([
          Commands.playlistMoveDown(this.index + 1), Commands.playlistGet()]);
    });

    this.$removeItem.on("click tap", e => {
      Service.queueCommandsFront([
          Commands.playlistRemove(this.index + 1), Commands.playlistGet()]);
    });

    this.$albumItem.on("click tap", e => {
      $(document).trigger('playlist-context-album', this.matchingLibraryItem);
    });
  }

  show($holder, $button, index) {
    super.show($holder, $button);
    this.index = index;
    
    const playlistItem = Model.playlistData[index];
    this.matchingLibraryItem = Model.library.getLibraryItemByTrackUri(playlistItem['@_uri']);

    ViewUtil.setDisplayed(this.$upItem, index > 0);
    ViewUtil.setDisplayed(this.$downItem, index < Model.playlistData.length - 1);
    ViewUtil.setDisplayed(this.$albumItem, !!this.matchingLibraryItem);
  }
}
