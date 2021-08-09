/**
 * Acts as go-between between `server.js` and HQPlayer.
 * Gets called by `server.js` via `sendCommandToHqp()` and then calls back with a payload.
 * Talks to HQPlayer via TCP socket.
 * 'Static class'.
 */

const dgram = require('dgram');
const net = require("net");
const fastXmlParser = require('fast-xml-parser');

const TROUBLESHOOTING_URL = 'https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md';
const UDP_ADDRESS = "239.192.0.199";
const PORT = 4321;
const XML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>`;
const POSSIBLY_MULTICHUNK_STARTS = ['<LibraryGet', '<PlaylistGet', '<GetFilters'];
const POSSIBLY_MULTICHUNK_ENDS = ['</LibraryGet>', '</PlaylistGet>', '</GetFilters>'];
const XML_PARSER_OPTIONS = { ignoreAttributes : false };

let initCallback;
let timeoutId;
let hqpIp;

/** UDP socket used for 'discovery' command. */
let discoSocket;
/** TCP socket which has a persistent connection to hqp. */
let socket;

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
  console.log('- creating udp socket');
	discoSocket = dgram.createSocket('udp4');
	
  discoSocket.on('error', () => {
    console.log(`\nudp socket error:\n${err.stack}\n`);
    discoSocket.close(); // todo recovery logic?
  });
  discoSocket.on('message', onDiscoSocketMessage);
  discoSocket.on('listening', onDiscoSocketListening);

	discoSocket.bind();
};

const onDiscoSocketListening = () => {
  console.log(`- udp socket listening on ${discoSocket.address().address}:${discoSocket.address().port}`);
  discoSocket.setMulticastLoopback(true);
  console.log(`- waiting for response from HQPlayer...`);
  timeoutId = setTimeout(onDiscoveryTimeout, 5000);
  sendUdpCommand(`<discover>hqplayer</discover>`);
};

const onDiscoveryTimeout = () => {
  console.log(`\nERROR: No response from HQPlayer`);
  console.log(`\nTIPS:`);
  console.log(`1. Verify HQPlayer Desktop is currently running`);
  console.log(`2. Verify HQPlayer's Settings dialog is not open.`);
  console.log(`3. Verify HQPlayer "Allow control from network" button is enabled.`);
  console.log(`4. For more troubleshooting info, see ${TROUBLESHOOTING_URL}.`);
  exitOnKeypress();
};

const onDiscoSocketMessage = (msg, rinfo) => {
  console.log(`- udp socket received message from ${rinfo.address}:${rinfo.port}`);
  if (!msg.toString().includes('<discover')) {
    console.log(`  unrecognized, ignoring`);
    return;
  }
  clearTimeout(timeoutId);
  let json;
  try {
    json = fastXmlParser.parse(msg.toString(), XML_PARSER_OPTIONS);
  } catch (error) {
    console.log(`\nERROR: Couldn't parse udp data as xml`);
    console.log(msg.toString());
    console.log(error + '\n');
    exitOnKeypress();
  }
  const o = json['discover'];
  if (o) {
    hqpHostname = o['@_name'];
    if (o['@_result'] != 'OK') {
      console.log(`\nWARNING: Did not get expected result=OK`);
    }
  }
  if (!hqpHostname) {
    console.log(`\nWARNING: Received no value for hostname`);
    console.log(msg.toString());
  }
  hqpIp = rinfo.address;
  initSocket();
};

const sendUdpCommand = (message) => {
  message = XML_HEADER + message;
	discoSocket.send(message, PORT, UDP_ADDRESS, (error) => {
    if (error) {
      console.log(`\nERROR sending udp message`);
      console.log(error + '\n');
      exitOnKeypress();
    }
  });
	// fyi, reference implementation also does this, but results in an error for me
	// socket.send(message, 4321, "ff08::c7", onError);
};

const initSocket = () => {
  console.log(`- connecting to tcp socket ${hqpIp}:${PORT}`);
  // Note, could also create connection using hostname instead of IP.
  // IP has proven to be more reliable when reconnecting windows hqpwv server to mac hqplayer, fwiw.
  socket = net.createConnection(PORT, hqpIp, () => {
    console.log('- tcp socket connected');  // rem, still need to wait for 'ready'
  });
  socket.on("error", onSocketError);
  socket.on("end", onSocketEnd);
  socket.on("data", onData);
  socket.on("ready", () => {
    console.log('- tcp socket ready');
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
  console.log('socket error:', error.message); 
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
  console.log('socket ended');
  if (responseCallback) {
    doCallback({ error: "socket_end" });
  }
  reset();
  initSocket();
}

// ---

const sendCommandToHqp = (xml, callback) => {
  // console.log(`client request: ${xml.substr(0,80)}`);

  if (!socket) {
    callback({ error: "not_connected"});
    clearValues();
    return;
  }
  if (clientRequestXml) {
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
    // Note too that if hqp receives an unrecognized command, it will close the socket.
    return;
  }

  // console.log('sending to hqp:', xml.substr(0, 80));
  socket.write(XML_HEADER + clientRequestXml);
}

// ---

const onData = (data) => {
  // console.log(`received ${data.length} bytes`);

  if (!clientRequestXml) {
    // hqp is sending data while no 'command' is pending.
    console.log(`warning: got data without command - ${data.toString().substr(0, 80)}`);
    return;
  }

  const dataAsString = data.toString();

  if (isFirstChunk) {    
    // console.log('is first chunk');
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
      // console.log(dataAsString.substr(0,80))
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
  // console.log(`is first normal chunk`);
  normalBuffer = data;
  finishNormalIfPossible(dataAsString, true);
}

const processNextChunk = (data, dataAsString) => {
  normalBuffer = Buffer.concat([normalBuffer, data]); // todo expensive? wd buffer stream be more efficient?
  // console.log(`is subsequent normal chunk, buffer len ${normalBuffer.length}`);
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
      console.log('warning: non-possibly-multichunk response did not parse, finishing anyway');
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
 * Filters out albums that have no track items (viz, playlist files)
 */
const postProcessLibrary = (json) => {
  if (!json['LibraryGet']['LibraryDirectory']) {
    // shouldn't happen
    return json;
  }

  let numDropped = 0;
  let albums1 = json['LibraryGet']['LibraryDirectory'];
  if (!Array.isArray(albums1)) {
    albums1 = [albums1];
  }
  const albums2 = [];
  for (let item of albums1) {
    if (item['LibraryFile']) {
      albums2.push(item);
    } else {
      // console.log('dropped', item);
      numDropped++;
    }
  }
  // replace with new filtered version
  json['LibraryGet']['LibraryDirectory'] = albums2;
  if (numDropped > 0) {
    console.log('- library - dropped ' + numDropped + ' empty entries');
  }
  return json;
};

const doCallback = (json) => {
  if (json.error) {
    console.log('- sending error response to client:', json.error);
  }
  responseCallback(json);
  clearValues();    
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
  console.log('Press any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 1))
};

module.exports = {
  sendCommandToHqp: sendCommandToHqp,
  start: start
};
