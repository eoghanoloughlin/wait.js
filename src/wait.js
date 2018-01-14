import $ from 'jquery';
import throttle from 'lodash.throttle';

/**
 * Keep a record of each timestamp used for namespacing events
 * as loops tend to go fast enough to generate duplicates
 *
 * @type {Array}
 */
let timestamps = [];

/**
 * Generates a custom scroll + resize
 * event namespace with a timestamp
 *
 * @param  {Number}         The timestamp
 *
 * @return {String}         The namespace
 */
const generateEventNameSpace = function(timestamp) {
    timestamp = timestamp || new Date().getTime();

    // if the timestamp has already been used (may occur if creating instances in a loop),
    // modify it to avoid duplicates
    if (timestamps.indexOf(timestamp) > -1) {
        timestamp = timestamp + timestamps.length;
    }

    timestamps.push(timestamp);

    return 'scroll.'+timestamp+' resize.'+timestamp;
};

/**
 * Trigger a custom 'visible' event on $element when
 * it becomes visible within the browser's viewport
 *
 * @param  {jQuery}     $element    A jQuery object containing the DOM node to watch
 * @param  {Object}     options     See below:
 *
 *          {Function}      callback    An optional callback to execute when the element comes in view
 *          {object}        context     What the value of 'this' should be inside the callback
 *          {Number}        offset      The number of pixels in advance of visibility to trigger the event/callback
 */
const wait = function($element, options = {}) {
    if (!$element instanceof $ || $element.length < 1) return false;

    /**
     * jQuery window object
     * @type {jQuery}
     */
    const $window = $(window);

    /**
     * A unique namespaced event used for scroll + window.resize to allow
     * easy event removal when this instance has served it's purpose or is
     * no longer needed.
     * @type {String}
     */
    const eventName = generateEventNameSpace();

    /**
     * The name of the event of a previous instance
     * with the element, if it exists.
     * @type {String|Undefined}
     */
    let oldEventName = $element.data('waitInstance');

    // If the element passed already has a 'waitInstance' data attribute,
    // this means an event has already been created for it, so remove the event
    if (oldEventName && typeof oldEventName === 'string') {
        $window.off(oldEventName);
    }

    // Set the waitInstance on the dom element for future checks
    $element.data('waitInstance', eventName);

    /**
     * Checks if the element is in view
     */
    const checkVisible = function() {
        let windowTop     = $window.scrollTop();
        let windowBottom  = windowTop + $window.height();
        let elementTop    = $element.offset().top;
        let elementBottom = elementTop + $element.height();
        let offset        = typeof options.offset === 'undefined' ? 0 : options.offset;

        // If any part of the element is within the browser's viewport
        if ((elementBottom + offset) >= windowTop && (elementTop - offset) <= windowBottom) {
            if ($element.is(':hidden')) return; // Don't do anything if it's a hidden element

            // Trigger a 'visible' event on the element
            $element.trigger('visible');

            // Remove it's data attribute, it's no longer needed
            $element.removeData('waitInstance');

            // Remove the event listener for this instance
            $window.off(eventName);

            // If a callback was passed, call it
            if (typeof options.callback === 'function') {
                options.callback.call(options.context || window);
            }
        }
    };

    // When the browser is scrolled or resized, check the element's visibility
    $window.on(eventName, throttle(checkVisible, 100));

    // And check it right now too
    checkVisible();
};

export default wait;