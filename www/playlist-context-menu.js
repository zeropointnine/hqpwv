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

  index = -1;
  matchingLibraryItem = null;

  constructor() {
    super($("#playlistContextMenu"));

    this.$upItem = this.$el.find("#playlistContextUp");
    this.$downItem = this.$el.find("#playlistContextDown");
    this.$removeItem = this.$el.find("#playlistContextRemove");

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
  }

  show($holder, $button, index) {
    super.show($holder, $button);
    this.index = index;
    
    const playlistItem = Model.playlist.array[index];
    this.matchingLibraryItem = Model.library.getAlbumByTrackUri(playlistItem['@_uri']);

    ViewUtil.setDisplayed(this.$upItem, index > 0);
    ViewUtil.setDisplayed(this.$downItem, index < Model.playlist.array.length - 1);
  }
}
