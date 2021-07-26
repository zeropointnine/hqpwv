const path = require('path');
const express = require('express');
const app = express();
const ip = require('ip');
const packageJson = require('./package.json');
const proxy = require('./proxy');
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
    console.log("server - rejected 'command', is busy");
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
 * Endpoint for 'native' REST requests.
 *
 * This could be blown out in the future if we add extra
 * layers of functionality on top of HQPlayer.
 */
app.get('/endpoints/native', (request, response) => {
  if (request.query.hqplayer_ip_address !== undefined) {
    response.send({ hqplayer_ip_address: hqpIp });
    return;
  }
  response.status(400).json( {error: 'Bad param data'} );
});

const onProxyReady = (ip) => {
  hqpIp = ip;
  server = app.listen(port, onSuccess).on('error', onError);
};

const onError = (e) => {
  if (e.code == 'EADDRINUSE') {
    console.log(`\nERROR: Port ${port} is in use.`);
    console.log(`\nTry using a different port:`);
    console.log(`     ${APP_FILENAME} -port [PORTNUMBER]\n`);
    exitOnKeypress();
  } else {
    console.log(`\nserver caught error: ${e.code}`);
  }
};

const onSuccess = () => {
  console.log(`- server is ready on port ${port}`);
  const ipAddress = ip.address();
  const urlText = ipAddress
      ? `http://${ipAddress}:${port}`
      : `the IP address of this machine (port ${port})`;
  console.log(`\n---------------------------------------------------`);
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

const exitOnKeypress = () => {
  console.log('\nPress any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 1))
};

console.log('\nHQPWV Server', packageJson.version);
console.log('Project page: ' + packageJson.homepage + '\n');
port = getPortFromArguments();
proxy.start(onProxyReady);
