import Values from './values.js';
import Commands from './commands.js';
import Model from './model.js';

/**
 * Manages service calls to the 'native' endpoint.
 */
class Native {

  /**
   * @param callback is given ip address as param, else null
   */
  getHqPlayerIpAddress(callback) {
    $.ajax({
      url: Values.NATIVE_ENDPOINT + "?hqplayer_ip_address",
      error: (e) => { cl(e); callback(null); },
      success: (data, textStatus, jqXHR) => {
        const ip = data['hqplayer_ip_address'];
        if (ip) {
          callback(ip);
        } else {
          cl('unexpected response data:', data);
          callback(null);
        }
      }
    });
  }
}

export default new Native();