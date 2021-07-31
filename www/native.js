import Values from './values.js';
import Commands from './commands.js';
import Model from './model.js';

/**
 * Manages service calls to the 'native' endpoint.
 */
class Native {

  /**
   * @param instanceId is sent to endpoint to track page instances connecting to the service
   * @param callback argument expected to be ip address, else null
   */
  getInfo(instanceId, callback) {
    const url = `${Values.NATIVE_ENDPOINT}?info&id=${instanceId}`;
    $.ajax({
      url: url,
      error: (e) => { cl(e); callback(null); },
      success: (data, textStatus, jqXHR) => { callback(data); }
    });
  }
}

export default new Native();