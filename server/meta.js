/**
 * HQPWV-specific metadata layer.
 * Pure json for the time being, stored to file system.
 */
const fs = require("fs");
const path = require('path');

const log = require('./log');

const FILENAME = 'hqpwv-metadata.json';
const PATH = path.resolve(FILENAME);

const ACTIVITY_COUNTER_THRESH = 10;
const ACTIVITY_TIMEOUT_DURATION = 5 * 60 * 1000;
const HISTORY_MAX_ITEMS = 1000;

const DEPRECATED_KEYS = ['tracks', 'history'];
const TRACKS_KEY = 'tracks-r2';
const HISTORY_KEY = 'history-r2';
const ALBUMS_KEY = 'albums';

let data;
let isEnabled = false;
let activityCounter = 0;
let activityTimeoutId = 0;

/**
 * Returns true for success.
 */
const init = () => {
  let isSuccess;
  isSuccess = initFile();
  if (!isSuccess) {
    return false;
  }
  isSuccess = loadData();
  if (!isSuccess) {
    return false;
  }
  isEnabled = true;
  startActivityTimeout();
  return true;
};

/**
 * Verifies files exists and is read/writable, or creates it.
 * Returns true for success.
 */
const initFile = () => {
  try {
    fs.accessSync(FILENAME, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    const doesntExist = (err.code == 'ENOENT');
    if (doesntExist) {
      log.x('create new metadata');
      data = makeData();
      const result = saveFile();
      return result;
    } else {
      log.x('error:', FILENAME, err.code);
      return false;
    }
  }
  return true;
};

const loadData = () => {
  let filedata;
  try {
    filedata = fs.readFileSync(FILENAME, {encoding: 'utf8'});
  } catch (err) {
    log.x(`error: couldn't load metadata`, err.code);
    log.x('  ' + PATH);
    return false;
  }
  let o = null;
  try {
    o = JSON.parse(filedata);
  } catch (err) {
    log.x(`error: couldn't parse metadata`);
    log.x('  ' + PATH);
    return false;
  }
  log.x('loaded metadata');
  log.x('  ' + PATH);

  // Delete deprecated properties
  for (const key of DEPRECATED_KEYS) {
    if (o[key]) {
      delete o[key];
      log.x('  deleted deprecated property [', key, ']');
    }
  }
  // Ensure the expected properties exist:
  if (!o[TRACKS_KEY]) {
    o[TRACKS_KEY] = {};
  }
  if (!o[ALBUMS_KEY]) {
    o[ALBUMS_KEY] = {};
  }
  if (!o[HISTORY_KEY]) {
    o[HISTORY_KEY] = [];
  }
  data = o;
  return true;
};

makeData = () => {
  const o = {};
  o[TRACKS_KEY] = {};
  o[ALBUMS_KEY] = {};
  o[HISTORY_KEY] = [];
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
};

// todo save to intermediate file and swap on success?
const saveFile = () => {
  try {
    fs.writeFileSync(FILENAME, JSON.stringify(data), {encoding: 'utf8'});
  } catch (err) {
    log.x(`warning couldn't save metadata`, err.code);
    log.x('  ' + PATH);
    return false;
  }
  log.i('saved metadata');
  return true;
};

// ---

const getData = () => {
  return data;
};

const getTracks = () => {
  return data[TRACKS_KEY];
};

const getAlbums = () => {
  return data[ALBUMS_KEY];
}

const getHistory = () => {
  return data[HISTORY_KEY];
};

const updateTrackFavorite = (hash, isFavorite) => {
  let track = data[TRACKS_KEY][hash];
  if (!track) {
    track = {};
    data[TRACKS_KEY][hash] = track;
  }
  track['favorite'] = isFavorite;
  activityTouch();
  return track['favorite'];
};

const updateAlbumFavorite = (hash, isFavorite) => {
  let album = data[ALBUMS_KEY][hash];
  if (!album) {
    album = {};
    data[ALBUMS_KEY][hash] = album;
  }
  album['favorite'] = isFavorite;
  activityTouch();
  return album['favorite'];
};

const updateTrackViews = (hash, numViews) => {
  let track = data[TRACKS_KEY][hash];
  if (!track) {
    track = {};
    data[TRACKS_KEY][hash] = track;
  }
  track['views'] = numViews;
  activityTouch();
  return track['views'];
};

const incrementTrackViews = (hash) => {
  let track = data[TRACKS_KEY][hash];
  if (!track) {
    track = {};
    data[TRACKS_KEY][hash] = track;
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
  const a = data[HISTORY_KEY];
  a.push(o);
  const excess = a.length - HISTORY_MAX_ITEMS;
  if (excess > 0) {
    a.splice(0, excess)
  }
};

/**
 * Removes track and album entries which are not in library.
 */
const clean = (resultCallback) => {
  // todo
  resultCallback(true);
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
  saveFile();
  startActivityTimeout();
};

// ---

module.exports = {
  init: init,
  getIsEnabled: getIsEnabled,
  getFilepath: getFilepath,
  getIsDirty: getIsDirty,
  saveFile: saveFile,
  getData: getData,
  getTracks: getTracks,
  getAlbums: getAlbums,
  getHistory: getHistory,
  updateTrackFavorite: updateTrackFavorite,
  updateAlbumFavorite: updateAlbumFavorite,
  incrementTrackViews: incrementTrackViews,
  updateTrackViews: updateTrackViews,
  clean: clean
};
