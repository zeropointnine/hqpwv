import Commands from './commands.js';
import Model from './model.js';
import Service from './service.js';
import Settings from './settings.js';
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
      // uris from hqp use html entities!
      const decodedUri = AppUtil.htmlDecode(uri);
      s += decodedUri + '\r\n';
    }
    return s;
  }

  static htmlDecode(s) {
    const doc = AppUtil.htmlDecodeDomParser.parseFromString(s, "text/html");
    return doc.documentElement.textContent;
  }
  static htmlDecodeDomParser = new DOMParser();

  static updateColorTheme() {
    const $html = $('html');
    switch (Settings.colorTheme) {
      case 'dark':
        $html.removeClass('lightTheme');
        break;
      case 'light':
        $html.addClass('lightTheme');
        break;
      default:
        cl('warning bad val', Settings.colorTheme)
    }
  }

  /**
   * Returns array
   */
  static splitGenreString(string) {
    if (!string) {
      return [];
    }
    // hqp genre string has html entities (!)
    string = AppUtil.htmlDecode(string);
    const a = string.split(/[,;/]/); // comma or semicolon or forward-slash
    for (let i = 0; i < a.length; i++) {
      a[i] = a[i].trim().toLowerCase();
      if (a[i].length > 50) {
        a[i] = a[i].substr(0, 50) + '…';
      }
    }
    const result = [];
    for (const item of a) {
      if (item) {
        result.push(item);
      }
    }
    return result;
  }
}
