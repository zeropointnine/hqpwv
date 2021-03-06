/**
 * 
 */
export default class ViewUtil {}

/**
 * Not useful but too late to refactor out.
 * Rem, setting visibility to 'visible' explicitly has 'side effects'.
 * Should be set to empty for normal, visible behavior!
 *
 * @param b - can be boolean; null or empty-string will set it to empty-string
 */
ViewUtil.setVisible = ($el, b) => {
  let value;
  if (b === null || b === '') {
    value = '';
  } else {
    value = b ? 'visible' : 'hidden';
  }
	$el.css("visibility", value);
};

ViewUtil.isVisible = ($el) => {
  return ($el.css("visibility") == 'visible');
};

ViewUtil.isDisplayed = ($el) => {
  const val = $el.css('display');
  return (val != 'none');
};

ViewUtil.setDisplayed = ($el, b) => {
  let value;
  if (b === 'flex') {
    value = b;
  } else {
    value = !!(b) ? 'block' : 'none';
  }
	$el.css("display", value);
};

/**
 * Uses the project's "noTransition" class to set css without triggering any associated transition. 
 * See https://stackoverflow.com/a/16575811
 */
ViewUtil.setCssSync = ($element, myFunction) => {
  $element.addClass('noTransition');
  myFunction();  // A function that should set the element's css.
  $element[0].offsetHeight;  // This triggers a reflow, flushing the CSS changes.
  $element.removeClass('noTransition');
}

ViewUtil.setCssPropertySync = ($element, $property, $value) => {
  $element.addClass('noTransition');
  $element.css($property, $value);
  $element[0].offsetHeight;
  $element.removeClass('noTransition');
};

/**
 * Just formalizes a consistent system to use for animating css and getting callbacks.
 * Does NOT call back if no transition was triggerd!
 * 
 * @param $element is the element on which the css transition should occur
 */
ViewUtil.setAnimatedCss = ($element, mutatorFunction, onCompleteFunction) => {
	mutatorFunction();
	if (onCompleteFunction) {
		$element.one('transitionend', onCompleteFunction);
	}
}

/**
 * Hah.
 *
 * Note limitation: The setSync element and the transitionend element must be the same.
 */
ViewUtil.animateCss = ($element, setSyncFunction, mutatorFunction, onCompleteFunction) => {
	if (setSyncFunction) {
		ViewUtil.setCssSync($element, setSyncFunction);
	}
	ViewUtil.setAnimatedCss($element, mutatorFunction, onCompleteFunction);
}

/**
 * Returns the position of an descendant element in the parent's coordinate space
 * as a 2-element array.
 */
ViewUtil.getPositionInParentSpace = (parent, descendant) => {
  const rectD = descendant.getBoundingClientRect();
  const rectP = parent.getBoundingClientRect();
  const x = rectD.left - rectP.left;
  const y = rectD.top - rectP.top;
  return [x, y];
};

/** Returns NaN if no value found. */
ViewUtil.getClientX = (mouseOrTouchEvent) => {
  const e = mouseOrTouchEvent;
  const x1 = e.clientX || undefined;
  const x2 = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : undefined;
  let x;
  if (x1 != undefined) {
    x = x1;
  } else if (x2 != undefined) {
    x = x2;
  } else {
    x = NaN;
  }
  return x;
};

/**
 * Prevent Safari from glitching by adding a timeout,
 * for use when setting focus on a list which would be otherwise still animating in :/
 */
ViewUtil.setFocus = ($el, safariTimeoutValue=500) => {
  if (ViewUtil.isSafari) {
    setTimeout(() => $el.focus(), safariTimeoutValue);
  }  else {
    this.$el.focus();
  }
};

ViewUtil.isSafari = () => {
  return (window.navigator.userAgent.indexOf('Safari') != -1
      && window.navigator.userAgent.indexOf('Chrome') == -1);
};

ViewUtil.isIOS = () => {
  return !!window.navigator.userAgent.match(/iPad/i)
      || !!window.navigator.userAgent.match(/iPhone/i);
}

ViewUtil.doStockFadeIn = ($el, callback=null) => {
  ViewUtil.setVisible($el, true);
  ViewUtil.animateCss($el,
      () => $el.css('opacity', 0),
      () => $el.css('opacity', 1),
      () => { if (callback) callback(); } );
};

/** Returns { x, y, w, h } */
ViewUtil.fitInRect = (srcW, srcH, destW, destH) => {
  const srcAr = srcW / srcH;
  const destAr = destW / destH;
  const mult = (srcAr > destAr) ? (destW / srcW) : (destH / srcH);
  const resultW = srcW * mult;
  const resultH = srcH * mult;
  const resultX = (destW - resultW) / 2;
  const resultY = (destH - resultH) / 2;
  return { x: resultX, y: resultY, w: resultW, h: resultH };
  // todo return 4-element array to be consistent w/ theotherstuff
};

ViewUtil.setLeftTopWidthHeight = ($el, x, y, w, h) => {
  $el.css('left', x + 'px');
  $el.css('top', y + 'px');
  $el.css('width', w + 'px');
  $el.css('height', h + 'px');
};
