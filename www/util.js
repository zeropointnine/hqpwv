import Service from './service.js'

/**
 * App-wide util functions.
 */
export default class Util {}

/** 
 * Shortcut for hooking up custom events off of document.
 * todo/nb: doesnt work correctly when target is not same object as where this fn is invoked from [?]
 */
Util.addAppListener = (context, eventName, callback) => {
	$(document).on(eventName, (e, ...rest) => callback.call(context, ...rest));
};

Util.durationText = (totalSeconds, ignoreSeconds=false) => {
	const totalMinutes = totalSeconds / 60;
	const hours = Math.floor(totalMinutes / 60);
	let displayMinutes = Math.floor(totalMinutes % 60);
	let displaySeconds = Math.floor(totalSeconds % 60);
	if (displaySeconds < 10) {
		displaySeconds = "0" + displaySeconds;
	}

	let result = '';
	if (hours) {
		// Add hours
		result += hours;
		if (displayMinutes < 10) {
			displayMinutes = "0" + displayMinutes;
		}
	}
	// Add minutes
	result += result ? (":" + displayMinutes) : displayMinutes;
	// Add seconds
	if (!ignoreSeconds) {
		result += ":" + displaySeconds;
	}
	return result;
};

/** Ex, "1h5m or 45m */
Util.durationTextHoursMinutes = (totalSeconds) => {
  "use strict";
  const hours = Math.floor(totalSeconds / 3600);
  const secondsRemainder = totalSeconds - (hours * 3600);
  const minutes = Math.round(secondsRemainder / 60);
  const result = hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  return result;
};

/**
 * Strips filename from an uri coming from hqplayer.
 * May not be complete.
 */
Util.stripFilenameFromHqpUri = (uri) => {
  if (!uri) {
    return uri;
  }
  const i1 = uri.indexOf('/');
  const i2 = uri.indexOf('\\');
  const separator = (i1 >= i2) ? '/' : '\\';
  const result = uri.substring(0, uri.lastIndexOf(separator));
  return result;
};

/**
 * Because jQuery objects are 'array-like' but not actual Arrays.
 */
Util.jqueryObjectIndexOf = ($jqueryObject, element) => {
  for (let i = 0; i< $jqueryObject.length; i++) {
    if ($jqueryObject[i] === element) {
      return i;
    }
  }
  return -1;
};

/**
 * @param delimiter would be say, ", " for a typical comma situation
 */
Util.makeCasualDelimitedString = (array, delimiter) => {
  let s = '';
  for (let el of array) {
    if (el === null || el === undefined || el === '') {
      continue;
    }
    if (s.length > 0) {
      s = s + delimiter + el;
    } else {
      s = el;
    }
  }
  return s;
};

Util.makeCasualSecondsString = (ms) => {
  let sec = (ms / 1000);
  sec = (Math.round(sec * 100) / 100).toFixed(2);
  return sec + 's';
};

Util.hasMatch = (arrayOfObjects, objectKey, value) => {
  for (let el of arrayOfObjects) {
    if (el[objectKey] === value) {
      return true;
    }
  }
  return false;
};
