import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import ToastView from './toast-view.js';

/**
 *
 */
export default class AppUtil {

  // todo experiment
  static doButtonAnim($button) {
    $button.addClass('buttonBlink');
    $button[0].offsetHeight;  // Forces sync style/css changes
    $button.removeClass('buttonBlink');
  }

  /**
   * Designed to add list of tracks to playlist.
   * Blocks and shows toast while executing.
   *
   * @param playlistAddCommands - should be all just <PlaylistAdd> commands
   * @param isReplace
   * @param isPlayNow
   * @param callback
   */
  static doPlaylistAdds(playlistAddCommands, isReplace=false, isPlayNow=false, callback=null) {

    const onComplete = () => {
      ToastView.hide();
      $(document).trigger('enable-user-input');
      if (callback) {
        callback();
      }
    };

    // Prep the commands array
    const a = [...playlistAddCommands];
    if (isReplace || isPlayNow) {
      a.unshift(Commands.stop() ,Commands.playlistClear()); // insert at front
    }
    a.push(Commands.playlistGet());
    if (isPlayNow) {
      a.push(Commands.play());
    }
    a.push( { xml: Commands.status(), callback: onComplete } );

    // Block while processing; show toast
    $(document).trigger('disable-user-input');
    let verbText;
    if (isPlayNow) {
      verbText = 'Playing';
    } else if (isReplace) {
      verbText = 'Adding';
    } else {
      verbText = 'Queueing';
    }

    const tracksText = (playlistAddCommands.length > 1) ? 'tracks' : 'track';
    const s = `${verbText} ${playlistAddCommands.length} ${tracksText}`;
    ToastView.show(s, 0);

    Service.queueCommandsFront(a);
  }

  /**
   * Creates m3u8 file's text content.
   * Uses library data for extinf lines when possible.
   * Uses uri format for location line // todo is this correct, or is plain file path better?
   * @param uriArray
   * @returns {string}
   */
  static makeM3U8(uriArray) {
    let s = '#EXTM3U\r\n';
    for (const uri of uriArray) {
      const hash = Model.library.getTrackHashForTrackUri(uri);
      let infLine;
      if (hash) {
        const [track, album] = Model.library.getTrackAndAlbumByHash(hash);
        const seconds = Math.floor(track['@_length']) || 180;
        const artist = album['@_artist'] || 'Artist';
        const song = track['@_song'] || 'Song';
        infLine = `#EXTINF:${seconds},${artist} - ${song}`;
      } else {
        infLine = `#EXTINF:180,Artist - Song`; // har
      }
      s += infLine + '\r\n';
      s += uri + '\r\n';
    }
    return s;
  }

}