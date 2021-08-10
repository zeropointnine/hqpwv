/**
 * HQPWV-specific metadata layer.
 * Pure json for the time being, stored to file system.
 */
const fs = require("fs");
const path = require('path');
const FILENAME = 'hqpwv-metadata.json'; // todo put this in the right docs dir?
const PATH = path.resolve(FILENAME);
const ACTIVITY_COUNTER_THRESH = 10;
const ACTIVITY_TIMEOUT_DURATION = 5 * 60 * 1000;
const HISTORY_MAX_ITEMS = 1000;

let data;
let isEnabled = false;
let activityCounter = 0;
let activityTimeoutId = 0;

const init = (resultCallback) => {

  // Verify file exists or access
  try {
    fs.accessSync(FILENAME, fs.constants.R_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code == 'ENOENT') {
      createFile(resultCallback);
      return;
    }
    console.log('- error: file access to meta', err.code);
    console.log('  ' + PATH);
    resultCallback(false);
    return;
  }

  // Load data
  let filedata;
  try {
    filedata = fs.readFileSync(FILENAME, {encoding: 'utf8'});
  } catch (err) {
    console.log(`- error: couldn't load meta`, err.code);
    console.log('  ' + PATH);
    resultCallback(false);
    return;
  }

  // Parse data
  let o = null;
  try {
    o = JSON.parse(filedata);
  } catch (err) {
    console.log(`- error: couldn't parse meta`);
    console.log('  ' + PATH);
    resultCallback(false);
  }

  console.log('- loaded metadata');
  console.log('  ' + PATH);
  data = o;
  finishInit();
  resultCallback(true); // init done
};

const createFile = (resultCallback) => {
  console.log('- will create new meta file');
  data = makeEmptyDataObject()
  saveToFile(saveResult => {
    if (saveResult) {
      finishInit();
    }
    resultCallback(saveResult);
  });
};

finishInit = () => {
  isEnabled = true;
  startActivityTimeout();
};

makeEmptyDataObject = () => {
  const o = {
    tracks: {},
    history: []
  };
  return o;
};

// ---

const getFilepath = () => {
  return PATH;
};

const getIsEnabled = () => {
  return isEnabled;
};

const getIsDirty = () => {
  return (activityCounter > 0);
}

const saveToFile = (resultCallback) => {
  // todo save to intermediate file and swap on success?
  try {
    fs.writeFileSync(FILENAME, JSON.stringify(data), {encoding: 'utf8'});
  } catch (err) {
    console.log('- warning error saving meta file', err.code);
    console.log('  ' + PATH);
    if (resultCallback != null) {
      resultCallback(false);
    }
    return;
  }
  console.log('- saved meta file');
  console.log('  ' + PATH);
  if (resultCallback != null) {
    resultCallback(true);
  }
};

/**
 * Removes track entries which are not in library.
 */
const clean = (resultCallback) => {
  // todo
  resultCallback(true);
};

const getData = () => {
  return data;
};

const getTracks = () => {
  return data['tracks'];
};

const getHistory = () => {
  return data['history'];
};

const getShallowCopyEmptyHistory = () => {
  const o = {
    'tracks': data['tracks'],
    'history': []
  };
  return o;
};

const updateTrackFavorite = (hash, isFavorite) => {
  let track = data['tracks'][hash];
  if (!track) {
    track = {};
    data['tracks'][hash] = track;
  }
  track['favorite'] = isFavorite;
  activityTouch();
  return track['favorite'];
};

const updateTrackViews = (hash, numViews) => {
  let track = data['tracks'][hash];
  if (!track) {
    track = {};
    data['tracks'][hash] = track;
  }
  track['views'] = numViews;
  activityTouch();
  return track['views'];
};

const incrementTrackViews = (hash) => {
  let track = data['tracks'][hash];
  if (!track) {
    track = {};
    data['tracks'][hash] = track;
  }
  if (track['views'] === undefined) {
    track['views'] = 0;
  }
  track['views']++;

  // Incrementing track automatically adds it to the history:
  addToHistory(hash);

  activityTouch();

  return track['views'];
};

const addToHistory = (hash) => {
  const o = {
    'hash': hash,
    'time': new Date().getTime()
  };
  const a = data['history'];
  a.push(o);
  const excess = a.length - HISTORY_MAX_ITEMS;
  if (excess > 0) {
    a.splice(0, excess)
  }
};

// Cheesy auto-save logic

activityTouch = () => {
  activityCounter++;
  if (activityCounter >= ACTIVITY_COUNTER_THRESH) {
    activitySaveMetaAndStartTimeout();
  }
};

startActivityTimeout = () => {
  activityTimeoutId = setTimeout(onActivityTimeout, ACTIVITY_TIMEOUT_DURATION);
};

onActivityTimeout = () => {
  if (activityCounter > 0) {
    activitySaveMetaAndStartTimeout();
  } else {

    startActivityTimeout();
  }
};

activitySaveMetaAndStartTimeout = () => {
  activityCounter = 0;
  clearTimeout(activityTimeoutId);
  saveToFile();
  startActivityTimeout();
};

// ---

module.exports = {
  init: init,
  getIsEnabled: getIsEnabled,
  getFilepath: getFilepath,
  getIsDirty: getIsDirty,
  saveToFile: saveToFile,
  clean: clean,
  getData: getData,
  getTracks: getTracks,
  getHistory: getHistory,
  getShallowCopyEmptyHistory: getShallowCopyEmptyHistory,
  updateTrackFavorite: updateTrackFavorite,
  incrementTrackViews: incrementTrackViews,
  updateTrackViews: updateTrackViews
};
