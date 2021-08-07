/**
 * HQPWV-specific metadata layer.
 * Pure json for the time being, stored to file system.
 */
const fs = require("fs");
const path = require('path');
const FILENAME = 'hqpwv-metadata.json'; // todo put this in the right docs dir?
const PATH = path.resolve(FILENAME);
let tracks = {};
let isEnabled = false;

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
  isEnabled = true;
  resultCallback(true); // init done
};

const createFile = (resultCallback) => {
  console.log('- will create new meta file');
  tracks = {};
  commit((result) => {
    if (result) {
      isEnabled = true;
    }
    resultCallback()
  });
};

// ---

const getFilepath = () => {
  return PATH;
};

const getIsEnabled = () => {
  return isEnabled;
};

const commit = (resultCallback) => {
  // todo save to intermediate file and swap on success, etc
  try {
    fs.writeFileSync(FILENAME, JSON.stringify(tracks), {encoding: 'utf8'});
  } catch (err) {
    console.log('- warning error saving meta file', err.code);
    console.log('  ' + PATH);
    resultCallback(false);
    return;
  }
  console.log('- saved meta file');
  console.log('  ' + PATH);
  resultCallback(true);
};

/**
 * Removes entries which are not in library.
 * todo
 */
const clean = (resultCallback) => {
  resultCallback(true);
};

const getTracks = () => {
  return tracks;
};

const updateTrackViews = (hash, views) => {
  let o = tracks[hash];
  if (!o) {
    o = {};
    tracks[hash] = o;
  }
  o['views'] = views;
};

const updateTrackRating = (hash, rating) => {
  let o = tracks[hash];
  if (!o) {
    o = {};
    tracks[hash] = o;
  }
  o['rating'] = rating;
};

// ---

module.exports = {
  init: init,
  getIsEnabled: getIsEnabled,
  getFilepath: getFilepath,
  commit: commit,
  clean: clean,
  getTracks: getTracks,
  updateTrackViews: updateTrackViews,
  updateTrackRating: updateTrackRating
};
