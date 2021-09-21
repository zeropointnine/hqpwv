/**
 * Acts as go-between between `server.js` and HQPlayer.
 * Gets called by `server.js` via `sendCommandToHqp()` and then calls back with a payload.
 * Talks to HQPlayer via TCP socket.
 */

const dgram = require('dgram');
const net = require("net");
const fastXmlParser = require('fast-xml-parser');

const log = require('./log');

const TROUBLESHOOTING_URL = 'https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md';
const UDP_ADDRESS = "239.192.0.199";
const PORT = 4321;
const XML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>`;
const POSSIBLY_MULTICHUNK_STARTS = ['<LibraryGet', '<PlaylistGet', '<GetFilters'];
const POSSIBLY_MULTICHUNK_ENDS = ['</LibraryGet>', '</PlaylistGet>', '</GetFilters>'];
const XML_PARSER_OPTIONS = { ignoreAttributes : false };

let initCallback;
let timeoutId;

/** UDP socket used for 'discovery' command. */
let discoSocket;
/** TCP socket which has a persistent connection to hqp. */
let socket;

/** The ip address of the HQPlayer socket server. */
let hqpIp;

let validHqpIps = [];
let validHqpHostnames = [];

let isFirstChunk = true;
let clientRequestXml; // The request data fro the client
let clientRequestAsJson; 
let responseCallback; // The callback to be invoked upon completion of the current 'command'
let normalBuffer = Buffer.alloc(0); // The buffered data which accumulates until complete, used for 'normal' responses
let isPossiblyMultiChunk;

const start = (callback) => {
  initCallback = callback;
  initDiscoverySocket();
};

const initDiscoverySocket = () => {
	if (discoSocket) {
		discoSocket.close();
	}
  log.x('creating udp socket');
	discoSocket = dgram.createSocket('udp4');
	
  discoSocket.on('error', () => {
    log.w(`udp socket error:\n${err.stack}\n`);
    discoSocket.close();
  });
  discoSocket.on('message', onDiscoSocketMessage);
  discoSocket.on('listening', onDiscoSocketListening);

	discoSocket.bind();
};

const onDiscoSocketListening = () => {
  log.x(`udp socket listening on ${discoSocket.address().address}:${discoSocket.address().port}`);
  discoSocket.setMulticastLoopback(true);
  log.x(`waiting for response from HQPlayer...`);
  timeoutId = setTimeout(onDiscoveryTimeout, 1500);
  sendUdpCommand(`<discover>hqplayer</discover>`);
};

const onDiscoSocketMessage = (msg, rinfo) => {
  log.x(`udp socket received message from ${rinfo.address}:${rinfo.port}`);
  if (!msg.toString().includes('<discover')) {
    log.x(`  unrecognized message, ignoring:`, msg.toString().substr(0,30));
    return;
  }
  let json;
  try {
    json = fastXmlParser.parse(msg.toString(), XML_PARSER_OPTIONS);
  } catch (error) {
    log.x(`ERROR: Couldn't parse udp data as xml`);
    log.x(msg.toString());
    log.x(error + '\n');
    return;
  }

  const o = json['discover'];
  if (!o) {
    return; // shdnthpn
  }
  if (o['@_result'] != 'OK') {
    log.x(`WARNING: Did not get expected result=OK`);
    return;
  }

  log.x('  ' + o['@_name']);

  validHqpIps.push(rinfo.address);
  validHqpHostnames.push(o['@_name']);
};

const onDiscoveryTimeout = () => {
  if (validHqpIps.length == 0) {
    printNoResponse();
    return;
  }
  if (validHqpIps.length > 1) {
    doSelectInstance();
    return;
  }

  hqpIp = validHqpIps[0];
  initSocket();
};

const printNoResponse = () => {
  log.x(`--------------------------------`);
  log.x(`ERROR: No response from HQPlayer`);
  log.x(`TIPS:`);
  log.x(`1. Make sure HQPlayer is currently running`);
  log.x(`2. Make sure HQPlayer's Settings dialog is not open.`);
  log.x(`3. Verify HQPlayer "Allow control from network" button is enabled.`);
  log.x(`4. For more troubleshooting info, see ${TROUBLESHOOTING_URL}.\n`);
  exitOnKeypress();
};

const doSelectInstance = () => {
  log.x('\nSelect which instance of HQPlayer to connect to:');
  const limit = Math.min(validHqpHostnames.length, 9);
  for (let i = 0; i < limit; i++) {
    log.x(`  [${i+1}] ${validHqpIps[i]} (${validHqpHostnames[i]})`);
  }
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', onSelectInstanceKeypress)
};

const onSelectInstanceKeypress = (buffer) => {
  const key = buffer.toString();
  const charCode = key.charCodeAt(0);
  if (charCode == 3) { // control-c
    process.exit();
  }
  const index = charCode - 49;
  if (index < 0 || index >= validHqpIps.length || index > 9) {
    return;
  }

  process.stdin.off('data', onSelectInstanceKeypress);
  process.stdin.setRawMode(false);

  hqpIp = validHqpIps[index];
  initSocket();
};

const sendUdpCommand = (message) => {
  message = XML_HEADER + message;
	discoSocket.send(message, PORT, UDP_ADDRESS, (error) => {
    if (error) {
      log.x(`ERROR sending udp message`);
      log.x(error + '\n');
      exitOnKeypress();
    }
  });
	// fyi, reference implementation also does this, but results in an error for me
	// socket.send(message, 4321, "ff08::c7", onError);
};

const initSocket = () => {
  log.x(`connecting to tcp socket ${hqpIp}:${PORT}`);
  // Note, could also create connection using hostname instead of IP.
  // IP has proven to be more reliable when reconnecting windows hqpwv server to mac hqplayer, fwiw.
  socket = net.createConnection(PORT, hqpIp, () => {
    log.x('tcp socket connected');  // rem, still need to wait for 'ready'
  });
  socket.on("error", onSocketError);
  socket.on("end", onSocketEnd);
  socket.on("data", onData);
  socket.on("ready", () => {
    log.x('tcp socket ready');
    if (initCallback) {
      initCallback(hqpIp);
      initCallback = null;
      // init finished.
    }
  });
};

/**
 * This will get called when hqp is not running
 * and also when settings is open (ECONNREFUSED).
 */
const onSocketError = (error) => {
  log.w('socket error:', error.message);
  if (responseCallback) {
    doCallback({error: "socket_error"});
  }
  reset();
  // Try to reconnect
  setTimeout(initSocket, 2000);
};

const onSocketEnd = () => {
  // This would only ever get initiated by hqp.
  // FYI, hqp will end the socket if it receives bad xml sometimes.
  log.w('socket ended');
  if (responseCallback) {
    doCallback({ error: "socket_end" });
  }
  reset();
  initSocket();
}

// -------------------------------------------------------------------

const isBusy = () => {
  return !!clientRequestXml;
};

const sendCommandToHqp = (xml, callback) => {
  if (!socket) {
    callback({ error: "not_connected"});
    clearValues();
    return;
  }
  if (clientRequestXml) {
    // Should not be possible unless there is a logic error in
    // proxy.js or server-command-handler.js
    callback({ error: 'proxy_is_busy' });
    clearValues();
    return;
  }

  clientRequestXml = xml;
  responseCallback = callback;
  try {
    clientRequestAsJson = fastXmlParser.parse(clientRequestXml, XML_PARSER_OPTIONS);
  } catch (error) {
    doCallback({ error: "request_xml_invalid" });
    // Note too that if hqp receives an unrecognized xml command, it will close the socket.
    return;
  }

  // log.x('sending to hqp:', xml.substr(0, 80));
  socket.write(XML_HEADER + clientRequestXml);
};

// ---

const onData = (data) => {
  // log.x(`received ${data.length} bytes`);

  const dataAsString = data.toString();

  if (!clientRequestXml) {
    // hqp is sending data while no 'command' is pending.
    log.w(`received data unprompted: ${dataAsString.substr(0, 40)}`);
    return;
  }


  if (isFirstChunk) {
    // log.x('is first chunk');
    isFirstChunk = false;

    if (!dataAsString.startsWith("<?xml")) {
      doCallback({ error: "hqp_bad_response" });
      return;
    }
    if (dataAsString.includes(`result="Error"`)) {
      // Hpq sends this if the command is unrecognized.
      // But also if the command is 'rejected' (eg, doing <Next> at the end of the playlist).
      // This makes it too ambiguous to be useful without extra case-by-case parsing.
      // So, do nothing.

      // doCallback({ error: "hqp_unknown_command" });
      // log.x(dataAsString.substr(0,80))
      // return;
    }

    for (const item of POSSIBLY_MULTICHUNK_STARTS) {
      if (clientRequestXml.includes(item)) {
        isPossiblyMultiChunk = true;
        break;
      }
    }

    processFirstChunk(data, dataAsString);
  } else {
    processNextChunk(data, dataAsString);
  }
};

// ---

const processFirstChunk = (data, dataAsString) => {
  // log.x(`is first normal chunk`);
  normalBuffer = data;
  finishNormalIfPossible(dataAsString, true);
}

const processNextChunk = (data, dataAsString) => {
  normalBuffer = Buffer.concat([normalBuffer, data]); // todo expensive? wd buffer stream be more efficient?
  // log.x(`is subsequent normal chunk, buffer len ${normalBuffer.length}`);
  finishNormalIfPossible(dataAsString, false);
}

const finishNormalIfPossible = (dataAsString, isFirstChunk) => {

  let firstChunkJson;
  if (isFirstChunk) {
    try {
      firstChunkJson = fastXmlParser.parse(dataAsString, XML_PARSER_OPTIONS);
    } catch (e) { }
  }

  let isComplete;
  if (firstChunkJson) {
    isComplete = true;
  } else {
    if (isPossiblyMultiChunk) {
      for (const item of POSSIBLY_MULTICHUNK_ENDS) {
        if (dataAsString.includes(item)) {
          isComplete = true;
          break;
        }
      }
    } else {
      log.w('non-possibly-multichunk response did not parse, finishing anyway');
      isComplete = true;
    }
  }
  if (!isComplete) {
    return;
  }

  let resultJson;
  if (firstChunkJson) {
    resultJson = firstChunkJson;
  } else {
    const bufferAsString = normalBuffer.toString();
    try {
      resultJson = fastXmlParser.parse(bufferAsString, XML_PARSER_OPTIONS);
    } catch (error) {
      resultJson = { error: "hqp_xml_invalid"};
    }
  }

  resultJson = postProcessJson(resultJson);

  doCallback(resultJson);
};

const postProcessJson = (json) => {
  // If library data, remove any albums with zero elements
  // Occurs with m3u8 (we're not supporting this). Also seen on WavPack w/o metadata.
  if (json['LibraryGet']) {
    return postProcessLibrary(json)
  }

  return json
};

/**
 * Do any filtering, etc.
 */
const postProcessLibrary = (json) => {
  return json;
};

const doCallback = (json) => {
  if (json.error) {
    log.w('sending error:', json.error, clientRequestXml.substr(0, 40));
  }
  const callback = responseCallback;
  clearValues();
  callback(json);
};

// ---

const clearValues = () => {
  isFirstChunk = true;
  clientRequestXml = null;
  clientRequestAsJson = null;
  responseCallback = null;
  normalBuffer = Buffer.alloc(0);
  isPossiblyMultiChunk = false;
}

const reset = () => {
  clearValues();
  if (socket) {
    socket.destroy();
    socket = null;
  }
};

const exitOnKeypress = () => {
  log.x('Press any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 1))
};

module.exports = {
  isBusy: isBusy,
  sendCommandToHqp: sendCommandToHqp,
  start: start
};
