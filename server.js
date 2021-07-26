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


app.use(express.static(WEBPAGE_DIR));

app.get('/endpoints/command', (request, response) => {
  if (isBusy) {
    // Only accept one request at a time (due to nature of hqp server)
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

const onInit = () => {
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

getIpBestGuess = () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  for (const [key, array] of Object.entries(networkInterfaces)) {
    for (item of array) {
      const isIPv4 = (item['family'].toLowerCase() == 'ipv4');
      const isInternal = item['internal'];
      if (isIPv4 && !isInternal) {
        return item['address'];
      }
    }
  }
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
proxy.start(onInit);
