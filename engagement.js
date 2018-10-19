/**
 * engagement.js - A script to measure the level of engagement on your content pages.
 * It is set up for use with Tealium IQ, but can be configured to work with any other TMS.
 * @author Even A. Nilsen
 * @version 1.0
 */
try {
  // Configure the milestones for scroll. The values are percentages.
  const MILESTONES = {
    medium: 40,
    full: 70,
  };

  // Configure the selectors used to identify the text content and the header on the page
  // and the words per minute.
  // The selectors can be any valid CSS selectors
  const ARTICLE_SELECTOR = 'article',
        HEADER_SELECTOR = 'header',
        WORDS_PER_MINUTE = 250;

  window.mediumEngagement = false;
  window.fullEngagement = false;
  window.firstScroll = false;
  window.secondScroll = false;
  window.scrollTracker = {
    [MILESTONES.medium]: 0,
    [MILESTONES.full]: 0,
  };

  /**
   * Returns true on newline, tabs, and whitespace
   * @param {string} c A single character
   */
  const ansiWordBound = function(c) {
    return (
      (' ' === c) ||
      ('\n' === c) ||
      ('\r' === c) ||
      ('\t' === c)
    );
  };

  /**
   * Returns an object with the estimated total reading time.
   * @param {string} text The complete article text
   * @param {object} options Config object OPTIONAL
   */
  const readingTime = function(text, options) {
    let words = 0;
    let start = 0;
    let end = text.length - 1;
    let wordbound;
    let i;
    
    options = options || {};
    
    options.wordsPerMinute = options.wordsPerMinute || 200;
    
    wordBound = options.wordBound || ansiWordBound;
    
    while (wordBound(text[start])) start++;
    while (wordBound(text[end])) end--;
    
    for (i = start; i <= end;) {
      for (; i <= end && !wordBound(text[i]); i++) ;
      words++;
      for (; i <= end && wordBound(text[i]); i++) ;
    }
    
    let minutes = words / options.wordsPerMinute;
    let time = minutes * 60 * 1000;
    let displayed = Math.ceil(minutes.toFixed(2));
    
    return {
      text: displayed + ' min read',
      minutes,
      time,
      words,
    };
  };

  /**
   * Returns a timer object with callback function that is called when the countdown
   * comes to zero.
   * @param {number} freq Countdown frequency
   */
  const makeGlobalTimer = function(freq) {
    freq = freq || 1000;

    let callbacks = [];

    let id = setInterval(function() {
      let idx;
      for (idx in callbacks) {
        if (Object.prototype.hasOwnProperty.call(callbacks, idx)) {
          callbacks[idx]();
        }
      }
    }, freq);

    return {
      id: function() {
        return id;
      },
      registerCallback: function(cb) {
        callbacks.push(cb);
      },
      cancel: function() {
        if (id !== null) {
          clearInterval(id);
          id = null;
        }
      },
    };
  };

  /**
   * Helper function instead of jQuery
   */
  const getDocumentLength = function() {
    let body = document.body,
        html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
  };

  /**
   * Helper function instead of jQuery
   */
  const getScrollTop = function() {
    let body = document.body,
        html = document.documentElement,
        supportPageOffset = window.pageXOffset !== undefined,
        isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');

    return supportPageOffset ? window.pageYOffset : isCSS1Compat ? html.scrollTop : body.scrollTop;
  };

  /**
   * Helper function instead of jQuery
   */
  const getViewportHeight = function() {
    let w = window,
        a = 'inner';
    
    if (!('innerHeight' in w)) {
      a = 'client';
      w = document.documentElement || document.body;
    }
    
    return w[a+'Height'];
  };

  /**
   * Helper function instead of jQuery
   */
  const getTimeStamp = function(millis) {
    let min = Math.floor(millis / 60000),
        sec = ((millis % 60000) / 1000).toFixed(0);
    return min + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // Initialization
  const article = document.querySelector(ARTICLE_SELECTOR);
  const header = document.querySelector(HEADER_SELECTOR);
  const children = article.children;
  let text;
  for (let i = 0; i < children.length; i++) {
    if (children[i].textContent) text += children[i].textContent.replace(/\s+/g, ' ');
  }

  const options = { wordsPerMinute: WORDS_PER_MINUTE };
  const readingTimeObj = readingTime(text, options);
  b['reading_time'] = Math.round(readingTimeObj.minutes).toString() + ' min';
  utag.DB(readingTimeObj);

  /**
   * Sends an event to Tealium IQ.
   * Can be configured to fit any other TMS.
   */
  const sendEvent = function() {
    if (mediumEngagement && firstScroll) {
      utag.link({
        event_action: 'Medium engagement',
        event_category: 'Content engagement',
        event_label: '40% of page scrolled and 25% of an estimated ' + Math.round(readingTimeObj.minutes).toString() + ' min read',
      });
      window.mediumEngagement = false;
    }
    if (fullEngagement && secondScroll) {
      utag.link({
        event_action: 'Full engagement',
        event_category: 'Content engagement',
        event_label: '70% of page scrolled and 50% of an estimated ' + Math.round(readingTimeObj.minutes).toString() + ' min read',
      });
      window.fullEngagement = false;
    }
  }

  window.onscroll = function() {
    // Capture the full length of the header + the article
    let articleHeight = article.scrollHeight + header.scrollHeight;
    // Capture the full length of the page
    let windowHeight = getDocumentLength();
    // Capture where the top of the page is after scroll
    let currentPosition = getScrollTop();
    // Capture how many pixels can be viewed by the user
    let windowViewingArea = getViewportHeight();
    // Figure out the bottom of what the user has scrolled to
    let bottomScrollPosition = currentPosition + windowViewingArea;
    // Figure out the rounded percentage of how much was scrolled
    let percentScrolled = parseInt((bottomScrollPosition / articleHeight * 100)
      .toFixed(0));
    utag.DB('Percent: ' + percentScrolled + ' %');
    if (percentScrolled >= MILESTONES.medium && percentScrolled < MILESTONES.full) {
      if (scrollTracker[MILESTONES.medium] === 0) {
        scrollTracker[MILESTONES.medium] = 1;
        scrollBucket = MILESTONES.medium.toString();
        window.firstScroll = true;
        sendEvent();
        utag.DB('Scroll: ' + MILESTONES.medium);
      }
    } else if (percentScrolled >= MILESTONES.full) {
      if (scrollTracker[MILESTONES.full] === 0) {
        scrollTracker[MILESTONES.full] = 1;
        scrollBucket = MILESTONES.full.toString();
        window.secondScroll = true;
        sendEvent();
        utag.DB('Scroll: ' + MILESTONES.full);
      }
    }
  };
  const mediumEngagementTimer = makeGlobalTimer(readingTimeObj.time / 4);
  const fullEngagementTimer = makeGlobalTimer(readingTimeObj.time / 2);

  mediumEngagementTimer.registerCallback(function() {
    window.mediumEngagement = true;
    sendEvent();
    mediumEngagementTimer.cancel();
  });

  fullEngagementTimer.registerCallback(function() {
    window.fullEngagement = true;
    sendEvent();
    fullEngagementTimer.cancel();
  });
} catch (error) {
  b.error_source = 'Engagement measurement - UID 81 ' +
    '(' + window.location.href + ')';
}