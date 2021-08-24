/**
 * Logger
 */

const makePrefix = (prepre) => {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `[${h}:${m}:${s} ${prepre}]`;
};

/** Log with no prefix and not filtered */
const x = (...rest) => {
  log(...rest);
}

const v = (...rest) => {
  log(makePrefix('v'), ...rest);
};

const i = (...rest) => {
  log(makePrefix('i'), ...rest);
};

const w = (...rest) => {
  log(makePrefix('w'), ...rest);
};

const e = (...rest) => {
  log(makePrefix('e'), ...rest);
};

// todo consider saving to file
const log = (...rest) => {
  console.log(...rest);
};

module.exports = {
  v: v, i: i, w: w, e: e, x: x
};
