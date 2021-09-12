import Service from './service.js'

/**
 * App-wide util functions.
 */
export default class Util {}

/** 
 * Hooks up custom events off of document.
 * Doesn't support removing listener.
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
Util.stripFilenameFromPath = (path) => {
  if (!path) {
    return path;
  }
  const i1 = path.indexOf('/');
  const i2 = path.indexOf('\\');
  const separator = (i1 >= i2) ? '/' : '\\';
  const result = path.substring(0, path.lastIndexOf(separator));
  return result;
};

Util.getFilenameFromPath = (path) => {
  if (!path) {
    return path;
  }
  const i1 = path.indexOf('/');
  const i2 = path.indexOf('\\');
  const separator = (i1 >= i2) ? '/' : '\\';
  const result = path.substring(path.lastIndexOf(separator) + 1);
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

Util.makeHowLongAgoString = (ms) => {
  let min = (ms / (1000 * 60));
  if (min < 50) {
    return Math.round(min) + 'm';
  }
  let hr  = (ms / (1000 * 60 * 60));
  if (hr < 22) {
    return Math.round(hr) + 'h';
  }
  let day = (ms / (1000 * 60 * 60 * 24));
  if (day < 6.5) {
    return Math.round(day) + 'd';
  }
  let wk  = (ms / (1000 * 60 * 60 * 24 * 7));
  if (wk < 3.5) {
    return Math.round(wk) + 'w';
  }
  let mo  = (ms / (1000 * 60 * 60 * 24 * 30));
  if (mo < 12.5) {
    return Math.round(m) + 'mo'
  }
  return '1y+';
};

// From https://medium.com/@nitinpatel_20236/
Util.shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
};

Util.getFileSuffix = (filename) => {
  if (!filename) {
    return null;
  }
  const i = filename.lastIndexOf('.');
  if (i == -1) {
    return null;
  }
  const s = filename.substr(i + 1);
  return s;
};

/**
 * Forces track list item to be fully visible, aligned to bottom edge
 * in the album view and playlist view.
 *
 * But only if it's currently partially or wholly cropped at the bottom,
 * and only if the jump is not too large.
 *
 * Idea is that when the track advances forward, the newly selected item
 * should be made visible as needed, as a convenience.
 * Should only be called when last-selected-item is above `$listItem`.
 */
Util.autoScrollListItem = ($listItem, $holder, step=2) => {
  // Distance of list item's bottom edge from bottom edge of container.
  const getBottomEdgeDistance = () => {
    const listBottom = $holder.scrollTop() + $holder.outerHeight();
    const itemBottom = $listItem[0].offsetTop + $listItem.outerHeight();
    return (itemBottom - listBottom);
  };

  const maxDistance = $listItem.outerHeight() * 2;
  const delta = getBottomEdgeDistance($listItem);
  if (delta < 0 || delta > maxDistance) {
    return;
  }

  $(document).trigger('disable-user-input');
  let count = 100; // failsafe lol
  const f = () => {
    // Must be recalculated on every frame
    // (rather than doing a simple css property assignment)
    // bc of dynamic sizing of container due to topbar scroll effect (!)
    const delta = getBottomEdgeDistance($listItem);
    if (delta < 1.01 || count-- <= 0) {
      clearInterval(id);
      $(document).trigger('enable-user-input');
      return;
    }
    const target = $holder.scrollTop() + step; // (delta * 0.35);
    $holder.scrollTop(target)
  };
  const id = setInterval(f, 16);
};

/**
 * Initiates browser file download.
 *
 * @param filename filename that will be pre-populated in browser "Save-as" dialog.
 * @param mimeType eg, "text/plain"
 * @param content
 */
Util.downloadFile = (filename, mimeType, content) => {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', window.URL.createObjectURL(blob));
  a.click();
};

Util.areUriAndPathEquivalent = (uri, path) => {
  if (!uri && !path) {
    return true;
  }
  if (!uri || !path) {
    return false;
  }
  path = path.replace('file://', '');
  return (uri == path);
};

// Pretty good test for touch devices
Util.isTouch =  !!("ontouchstart" in window) || window.navigator.msMaxTouchPoints > 0;
