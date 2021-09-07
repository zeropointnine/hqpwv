/**
 * Manages hqpwv-generated playlists
 * (ie, not the ones that are included in the hqp library).
 */
const fs = require("fs");
const path = require('path');
const PATH = path.resolve('hqpwv-playlists');

const log = require('./log');

let isEnabled = false;

/**
 * Returns true for success.
 */
const init = () => {
  if (fs.existsSync(PATH)) {
    return true;
  }
  fs.mkdirSync(PATH);
  if (fs.existsSync(PATH)) {
    log.x('- created dir', PATH)
    return true;
  }
  log.x(`- error: couldn't create directory`, PATH);
  return false;
};

const getIsEnabled = () => {
  return isEnabled;
};

const getPlaylists = () => {
  let files = fs.readdirSync(PATH);
  files = files.filter(file => file.endsWith('.m3u8'));
  files = files.map(filename => {
    return {
      name: PATH + path.sep + filename,
      time: fs.statSync(PATH + '/' + filename).mtime.getTime()
    }
  });
  files.sort((a, b) => b.time - a.time);
  files = files.map(o => o['name']);
  return files;
};

const savePlaylist = (name, data) => {
  // Validate, if only a little
  if (!name) {
    log.w('save playlist no filename');
    return false;
  }
  if (!data.startsWith('#EXTM3U')) {
    log.w('save playlist received bad playlist data');
    return false;
  }
  if (data.length > 500 * 1000) {
    log.w('save playlist sus filelength, ignoring');
    return false;
  }
  // todo sanitize name ffs
  let name2 = name;
  if (!name2.endsWith('.m3u8')) {
    name2 = name2 + '.m3u8';
  }
  const filepath = PATH + path.sep + name2;
  try {
    fs.writeFileSync(filepath, data, {encoding: 'utf8'});
  } catch (err) {
    log.w(`save playlist couldn't save`, err.code, filepath);
    return false;
  }
  return true;
};

const deletePlaylist = (name) => {
  if (!name) {
    return false;
  }
  if (!name.endsWith('.m3u8')) {
    name = name + '.m3u8';
  }
  const filepath = PATH + path.sep + name;
  if (!fs.existsSync(filepath)) {
    log.w('delete playlist no such file to delete', filepath);
    return false;
  }
  try {
    fs.unlinkSync(filepath);
  } catch (e) {
    log.w(`delete playlist couldn't delete file`, e.code, filepath);
    return false;
  }
  return true;
};

module.exports = {
  init: init,
  getIsEnabled: getIsEnabled,
  getPlaylists: getPlaylists,
  savePlaylist: savePlaylist,
  deletePlaylist: deletePlaylist
};
