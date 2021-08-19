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
  META_DOWNLOAD_LINK = this.ENDPOINTS_BASE_URL + 'meta?getDownload';
  PLAYLIST_ENDPOINT = this.ENDPOINTS_BASE_URL + 'playlist';

  _hqpwvIp;
  _hqpwvVersion = '';
  _hqplayerIp;
  _imagesEndpoint;
  _startTime = new Date().getTime();

  constructor() {
    // Dev convenience
    if (!window.hqpwv) {
      window.hqpwv = {};
    }
    window.hqpwv.Values = this;
  }

  setValues(nativeGetInfoData) {
    this._hqpwvVersion = nativeGetInfoData['hqpwv_version'];
    this._hqpwvIp = nativeGetInfoData['server_ip_address'];
    this._hqplayerIp = nativeGetInfoData['hqplayer_ip_address'];
    this._imagesEndpoint = 'http://' + this._hqplayerIp + ':8088' + '/cover/';
  }

  get hqpwvVersion() {
    return this._hqpwvVersion;
  }

  get hqpwvIp() {
    return this._hqpwvIp;
  }

  get hqplayerIp() {
    return this._hqplayerIp;
  }

  get areOnDifferentMachines() {
    return (this._hqpwvIp != this._hqplayerIp);
  }

  get imagesEndpoint() {
    return this._imagesEndpoint;
  }

  get uptimeString() {
    const delta = new Date().getTime() - this._startTime;
    return Util.makeCasualSecondsString(delta);
  }
}

export default new Values();