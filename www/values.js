/**
 *
 */
export default class Values {
  static PROJECT_URL = 'https://github.com/zeropointnine/hqpwv';
  static TROUBLESHOOTING_HREF = 'https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md';

  static ENDPOINTS_BASE_URL = window.location.origin + "/endpoints/";
  static COMMAND_ENDPOINT = Values.ENDPOINTS_BASE_URL + "command";

  // todo support configurations where hqp and hqpwv not on same machine?
  static HQPLAYER_IMAGE_SERVER_URL = window.location.protocol + '//' + window.location.hostname + ':8088' + '/cover/';
}
