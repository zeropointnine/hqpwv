import Util from './util.js';

/**
 * Various simple global values.
 */
class Values {

  PROJECT_URL = 'https://github.com/zeropointnine/hqpwv';
  TROUBLESHOOTING_HREF = 'https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md';
  ENDPOINTS_BASE_URL = window.location.origin + '/endpoints/'; // default
  COMMAND_ENDPOINT = this.ENDPOINTS_BASE_URL + "command";
  NATIVE_ENDPOINT = this.ENDPOINTS_BASE_URL + 'native';
  META_ENDPOINT = this.ENDPOINTS_BASE_URL + 'meta';

  _hqpwvVersion = '';
  _imagesEndpoint;
  _startTime = new Date().getTime();

  constructor() {
    // Set hqplayer image server endpoint to that of webserver
    // as a default-slash-fallback.
    this.setImagesEndpointUsing(window.location.hostname);
  }

  get imagesEndpoint() {
    return this._imagesEndpoint;
  }

  setImagesEndpointUsing(ipAddress) {
    ipAddress = ipAddress ? ipAddress : window.location.hostname;
    this._imagesEndpoint = 'http://' + ipAddress + ':8088' + '/cover/';
  }

  get hqpwvVersion() {
    return this._hqpwvVersion;
  }

  set hqpwvVersion(s) {
    if (! s) {
      s = '';
    } else {
      if (!s.startsWith('v')) {
        s = 'v' + s;
      }
    }
    this._hqpwvVersion = s;
  }

  get uptimeString() {
    const delta = new Date().getTime() - this._startTime;
    return Util.makeCasualSecondsString(delta);
  }
}

export default new Values();