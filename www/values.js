/**
 *
 */
class Values {

  PROJECT_URL = 'https://github.com/zeropointnine/hqpwv';
  TROUBLESHOOTING_HREF = 'https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md';

  ENDPOINTS_BASE_URL = window.location.origin + '/endpoints/';
  COMMAND_ENDPOINT = this.ENDPOINTS_BASE_URL + "command";
  NATIVE_ENDPOINT = this.ENDPOINTS_BASE_URL + 'native';
  _imagesEndpoint;

  constructor() {
    // Set hqplayer image server endpoint to that of webserver
    // as a default-slash-fallback.
    this.setImagesEndpointUsing(window.location.hostname);
  }

  get imagesEndpoint() {
    return this._imagesEndpoint;
  }

  setImagesEndpointUsing(ipAddress) {
    this._imagesEndpoint = 'http://' + ipAddress + ':8088' + '/cover/';
  }
}

export default new Values();