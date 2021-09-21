/**
 * Logger
 */

const LEVEL_VERBOSE = 0;
const LEVEL_INFO = 1;
const LEVEL_WARNING = 2;
const LEVEL_ERROR = 3;
let _level = LEVEL_INFO;

const setLevel = (level) => {
  _level = level;
  if (_level > LEVEL_ERROR) {
    _level = LEVEL_ERROR;
  }
};

/** "x" is for user-facing messages, typicaly just for startup. */
const x = (...rest) => {
  log(...rest);
}

const v = (...rest) => {
  if (_level > LEVEL_VERBOSE) {
    return;
  }
  log(makePrefix('v'), ...rest);
};

const i = (...rest) => {
  if (_level > LEVEL_INFO) {
    return;
  }
  log(makePrefix('i'), ...rest);
};

const w = (...rest) => {
  if (_level > LEVEL_WARNING) {
    return;
  }
  log(makePrefix('w'), ...rest);
};

const e = (...rest) => {
  log(makePrefix('e'), ...rest);
};

// todo consider saving to file
const log = (...rest) => {
  console.log(...rest);
};

const makePrefix = (prepre) => {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `[${h}:${m}:${s} ${prepre}]`;
};

module.exports = {
  v: v,
  i: i,
  w: w,
  e: e,
  x: x,

  setLevel: setLevel,
  LEVEL_VERBOSE: LEVEL_VERBOSE,
  LEVEL_INFO: LEVEL_INFO,
  LEVEL_WARNING: LEVEL_WARNING,
  LEVEL_ERROR: LEVEL_ERROR
};
