const log = require('./log');
const proxy = require('./proxy');

const QUEUE_MAX = 10;
const TIMEOUT_MS = 3000;

let currentItem;
let queue = [];

const go = (request, response) => {

  const item = {
    request: request,
    response: response,
    time: new Date().getTime()
  };
  if (queue.length >= QUEUE_MAX) {
    sendErrorAndDoNext(item, 'queue_full');
    return;
  }

  queue.push(item);

  if (currentItem) {
    // A request is in flight and will conclude with doNext being called.
  } else {
    doNext();
  }
};

const doNext = () => {
  if (queue.length == 0) {
    return;
  }

  currentItem = queue.shift();

  const delta = new Date().getTime() - currentItem.time;
  if (delta > TIMEOUT_MS) {
    sendErrorAndDoNext(currentItem, 'queue_timeout');
    return;
  }

  const xml = currentItem.request.query.xml;
  proxy.sendCommandToHqp(xml, (json) => {
    currentItem.response.send(json);
    currentItem = null;
    doNext();
  });
};

const sendErrorAndDoNext = (item, message) => {
  const xmlSubstring = (item.request.query.xml) ? item.request.query.xml.substr(0, 40) : '';
  log.w('sending error:', message, xmlSubstring);
  item.response.send({ error: message });
  currentItem = null;
  doNext();
};

module.exports = {
  go: go
};
