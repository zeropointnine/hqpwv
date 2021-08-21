/**
 * Server entrypoint.
 * Plain js.
 */

const path = require('path');
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const ip = require('ip');
const packageJson = require('./package.json');
const proxy = require('./proxy');
const meta = require('./meta');
const metaHandler = require('./server-meta-handler');
const playlistHandler = require('./server-playlist-handler');
const playlists = require('./playlists');
const APP_FILENAME = `hqpwv`;
const WEBPAGE_DIR = path.join( __dirname, './www' );
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
    console.log(`- proxy busy, rejected ${info} from ${request.connection.remoteAddress}`);
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
    console.log('- warning meta init failed, hqpwv metadata disabled')
  } else {
    console.log('- meta ready');
  }

  // Init custom playlists
  isSuccess = playlists.init();
  if (!isSuccess ) {
    console.log('- warning custom playlists init failed, will be disabled')
  } else {
    console.log('- custom playlists ready');
  }
};

// ---

const onError = (e) => {
  if (e.code == 'EADDRINUSE') {
    console.log(`\nERROR: Port ${port} is in use.`);
    console.log(`\nTry using a different port:`);
    console.log(`     ${APP_FILENAME} -port [PORTNUMBER]\n`);
    showPromptAndExit();
  } else {
    console.log(`\nserver caught error: ${e.code}`);
  }
};

const onSuccess = () => {
  console.log(`- webserver is ready on port ${port}`);
  const ipAddress = ip.address();
  const urlText = ipAddress
      ? `http://${ipAddress}:${port}`
      : `the IP address of this machine on port ${port}`; // yek
  console.log(`\n----------------------------------------------------`);
  console.log(`READY.`);
  console.log(`Now browse to ${urlText}`);
  console.log(`from a device on your local network.`);
  console.log(`Please keep this process running.`);
  console.log(`----------------------------------------------------\n`);
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
  console.log('Optional arguments:');
  console.log('\n--port [portnumber]');
  console.log('    Port to run the webserver on (default is ' + DEFAULT_PORT + ')');
  console.log('\n--hqpip [ip_address]');
  console.log('    IP address of the machine running HQPlayer.');
  console.log('    Only necessary if running multiple instances');
  console.log('    of HQPlayer on the network.');
  console.log('');
};

const showPromptAndExit = () => {
  console.log('\nPress any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 1))
};

// Save meta json before exiting
process.on( "SIGINT", function() {
  if (meta.getIsDirty()) {
    meta.saveFile();
  }
  console.log('- done');
  process.exit();
});

// ---

console.log(`\n----------------------------------------------------`);
console.log('HQPWV Server', packageJson.version);
console.log('Project page: ' + packageJson.homepage);
if (isArgHelp()) {
  console.log(`----------------------------------------------------\n`);
  printHelp();
  return;
} else {
  console.log('Use --help for available options.');
  console.log(`----------------------------------------------------\n`);
}

port = getArgPort();
proxy.start(onProxyReady);
