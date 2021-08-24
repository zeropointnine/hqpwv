/**
 * Server entrypoint.
 * Plain js.
 */

const path = require('path');
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const ip = require('ip');

const log = require('./log');
const packageJson = require('./../package.json');
const proxy = require('./proxy');
const meta = require('./meta');
const metaHandler = require('./server-meta-handler');
const playlistHandler = require('./server-playlist-handler');
const playlists = require('./playlists');

const APP_FILENAME = `hqpwv`;
const WEBPAGE_DIR = path.join( __dirname, './../www' );
const DEFAULT_PORT = 8000;

let port;
let server;
let isBusy = false;
let hqpIp;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(WEBPAGE_DIR));

/**
 * 'commands'
 * These get proxied to/from HQPlayer.
 * Note the enforcement of a one-at-a-time policy
 * (due to nature of socket server).
 */
app.get('/endpoints/command', (request, response) => {
  if (isBusy) {
    let info = '';
    if (request.query.xml) {
      info = `${request.query.xml.substr(0,40)}`;
    }
    log.w(`proxy busy, rejected ${info} from ${request.connection.remoteAddress}`);
    response.send({ error: "server_is_busy" });
    return;
  }
  isBusy = true;
  const xml = request.query.xml;
  proxy.sendCommandToHqp(xml, (json) => {
    response.send(json);
    isBusy = false;
  });  
});

/**
 * 'native'
 */
app.get('/endpoints/native', (request, response) => {

  if (request.query.info !== undefined) {
    response.send({
      hqplayer_ip_address: hqpIp,
      server_ip_address: ip.address(),
      hqpwv_version: packageJson.version
    });
    return;
  }
  // No recognized param
  response.status(400).json( {error: 'bad_param_data'} );
});

/**
 * 'meta'
 */
app.get('/endpoints/meta', (request, response) => {
  metaHandler.doGet(request, response);
});

/**
 * 'playlist'
 */
app.get('/endpoints/playlist', (request, response) => {
  playlistHandler.doGet(request, response);
});

app.post('/endpoints/playlist', (request, response) => {
  playlistHandler.doPost(request, response);
});

// ---

const onProxyReady = (ip) => {
  hqpIp = ip;
  // Start server
  server = app.listen(port, onSuccess).on('error', onError);

  // Init meta
  let isSuccess = meta.init();
  if (!isSuccess) {
    log.x('- warning meta init failed, hqpwv metadata disabled')
  } else {
    log.x('- meta ready');
  }

  // Init custom playlists
  isSuccess = playlists.init();
  if (!isSuccess ) {
    log.x('- warning custom playlists init failed, will be disabled')
  } else {
    log.x('- custom playlists ready');
  }
};

// ---

const onError = (e) => {
  if (e.code == 'EADDRINUSE') {
    log.x(`\nERROR: Port ${port} is in use.`);
    log.x(`\nTry using a different port:`);
    log.x(`     ${APP_FILENAME} -port [PORTNUMBER]\n`);
    showPromptAndExit();
  } else {
    log.e(`server caught error: ${e.code}`);
  }
};

const onSuccess = () => {
  log.x(`- webserver is ready on port ${port}`);
  const ipAddress = ip.address();
  const urlText = ipAddress
      ? `http://${ipAddress}:${port}`
      : `the IP address of this machine on port ${port}`; // yek
  log.x(`\n----------------------------------------------------`);
  log.x(`READY.`);
  log.x(`Now browse to ${urlText}`);
  log.x(`from a device on your local network.`);
  log.x(`Please keep this process running.`);
  log.x(`----------------------------------------------------\n`);
};

/**
 * Expects something like `port 8000`, `-port 8000`, `--port 8000`, or simply `8000`
 */
getArgPort = () => {
  const value = getArgValue('port');
  const intValue = parseInt(value);
  return (!isNaN(intValue) && intValue > 0) ? intValue : DEFAULT_PORT;
};

/**
 * Returns the argument that follows the specified argument.
 * @param key should not have leading dashes
 */
getArgValue = (key) => {
  for (let i = 2; i < process.argv.length - 1; i++) {
    const arg = process.argv[i];
    if (arg == key || arg == ('-' + key) || arg == ('--' + key)) {
      const value = process.argv[i + 1];
      return value;
    }
  }
  return null;
};

isArgHelp = () => {
  const arg1 = process.argv[2];
  if (!arg1) {
    return false;
  }
  return (arg1.startsWith('help') || arg1.startsWith('-help') || arg1.startsWith('--help'));
};

printHelp = () => {
  log.x('Optional arguments:');
  log.x('\n--port [portnumber]');
  log.x('    Port to run the webserver on (default is ' + DEFAULT_PORT + ')');
  log.x('\n--hqpip [ip_address]');
  log.x('    IP address of the machine running HQPlayer.');
  log.x('    Only necessary if running multiple instances');
  log.x('    of HQPlayer on the network.');
  log.x('');
};

const showPromptAndExit = () => {
  log.x('\nPress any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 1))
};

// Save meta json before exiting
process.on( "SIGINT", function() {
  if (meta.getIsDirty()) {
    meta.saveFile();
  }
  log.x('- done');
  process.exit();
});

// ---

log.x(`\n----------------------------------------------------`);
log.x('HQPWV Server', packageJson.version);
log.x('Project page: ' + packageJson.homepage);
if (isArgHelp()) {
  log.x(`----------------------------------------------------\n`);
  printHelp();
  return;
} else {
  log.x('Use --help for available options.');
  log.x(`----------------------------------------------------\n`);
}

port = getArgPort();
proxy.start(onProxyReady);
