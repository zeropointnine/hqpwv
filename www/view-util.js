/**
 * 
 */
export default class ViewUtil {}

ViewUtil.setVisible = ($el, b) => {
	$el.css("visibility", (b ? "visible" : "hidden"));
};

ViewUtil.isVisible = ($el) => {
  return ($el.css("visibility") == 'visible');
};


ViewUtil.setDisplayed = ($el, b) => {
	$el.css("display", (b ? "block" : "none"));
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