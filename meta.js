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

let tracks = {};
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
  tracks = o;
  finishInit();
  resultCallback(true); // init done
};

const createFile = (resultCallback) => {
  console.log('- will create new meta file');
  tracks = {};
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
}

// ---

const getFilepath = () => {
  return PATH;
};

const getIsEnabled = () => {
  return isEnabled;
};

const saveToFile = (resultCallback) => {
  // todo save to intermediate file and swap on success?
  try {
    fs.writeFileSync(FILENAME, JSON.stringify(tracks), {encoding: 'utf8'});
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
 * Removes entries which are not in library.
 */
const clean = (resultCallback) => {
  // todo
  resultCallback(true);
};

const getTracks = () => {
  return tracks;
};

const updateTrackViews = (hash, numViews) => {
  let o = tracks[hash];
  if (!o) {
    o = {};
    tracks[hash] = o;
  }
  o['views'] = numViews;
  activityTouch();
};

const updateTrackFavorite = (hash, isFavorite) => {
  let o = tracks[hash];
  if (!o) {
    o = {};
    tracks[hash] = o;
  }
  o['favorite'] = isFavorite;
  activityTouch();
};

// Cheesy auto-save logic

activityTouch = () => {
  activityCounter++;
  // console.log('x counter', activityCounter);
  if (activityCounter >= ACTIVITY_COUNTER_THRESH) {
    // console.log('x reached counter thresh');
    activitySaveMetaAndStartTimeout();
  }
};

startActivityTimeout = () => {
  // console.log('x timeout-start');
  activityTimeoutId = setTimeout(onActivityTimeout, ACTIVITY_TIMEOUT_DURATION);
};

onActivityTimeout = () => {
  // console.log('x on-timeout');
  if (activityCounter > 0) {
    activitySaveMetaAndStartTimeout();
  } else {

    startActivityTimeout();
  }
};

activitySaveMetaAndStartTimeout = () => {
  // console.log('x save');
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
  saveToFile: saveToFile,
  clean: clean,
  getTracks: getTracks,
  updateTrackViews: updateTrackViews,
  updateTrackFavorite: updateTrackFavorite
};
