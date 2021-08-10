/**
 * Server entrypoint.
 * Plain js.
 */

const path = require('path');
const express = require('express');
const app = express();
const ip = require('ip');
const packageJson = require('./package.json');
const proxy = require('./proxy');
const meta = require('./meta');
const metaHandler = require('./server-meta-handler');
const APP_FILENAME = `hqpwv`;
const WEBPAGE_DIR = path.join( __dirname, './www' );
const DEFAULT_PORT = 8000;

let port;
let server;
let isBusy = false;
let hqpIp;

app.use(express.static(WEBPAGE_DIR));

/**
 * Endpoint for 'commands' that get proxied to HQPlayer.
 * Note the enforcement of a one-at-a-time policy
 * (due to nature of socket server)
 */
app.get('/endpoints/command', (request, response) => {
  if (isBusy) {
    console.log("webserver - rejected 'command', is busy");
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
// todo if no call to `command` in X seconds, save meta if necessary

/**
 * Endpoint for 'native' REST requests.
 */
app.get('/endpoints/native', (request, response) => {

  if (request.query.info !== undefined) {
    response.send({
      hqplayer_ip_address: hqpIp,
      hqpwv_version: packageJson.version
    });
    return;
  }
  // No recognized param
  response.status(400).json( {error: 'bad_param_data'} );
});

/**
 * Endpoint for 'meta' REST requests.
 */
app.get('/endpoints/meta', (request, response) => {
  metaHandler.go(request, response);
});

const onProxyReady = (ip) => {
  hqpIp = ip;
  // Start server
  server = app.listen(port, onSuccess).on('error', onError);

  initMeta();
};

const initMeta = () => {
  meta.init((result) => {
    if (!result) {
      console.log('- warning meta init failed, hqpwv metadata disabled')
    } else {
      console.log('- meta ready');
    }
  });
};

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
      : `the IP address of this machine (port ${port})`;
  console.log(`\n---------------------------------------------------`);
  console.log(`READY.`);
  console.log(`To use HQPWV, browse to ${urlText}`);
  console.log(`from a device on your local network.`);
  console.log(`Please keep this process running.`);
  console.log(`---------------------------------------------------\n`);
};

getPortFromArguments = () => {
  let port = DEFAULT_PORT;
  if (process.argv.length == 3) {
    const val = parseInt(process.argv[2]);
    if (!isNaN(val) && val > 0) {
      port = val;
    }
  } else if (process.argv.length >= 4) {
    if (process.argv[2] == '--port' || process.argv[2] == '-port' || process.argv[2] == 'port') {
      const val = parseInt(process.argv[3]);
      if (!isNaN(val) && val > 0) {
        port = val;
      }
    }
  }
  return port;
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
    meta.saveToFile(() => {
      console.log('Done');
      process.exit();
    });
  } else {
    process.exit();
  }
});

// ---

console.log('\nHQPWV Server', packageJson.version);
console.log('Project page: ' + packageJson.homepage + '\n');
port = getPortFromArguments();
proxy.start(onProxyReady);