
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var translate = require('translate');
var events = require('events');
var min = Math.min;
var max = Math.max;

/**
 * Expose `SwipePane`.
 */

module.exports = SwipePane;

/**
 * Turn `el` into a scrollable element.
 *
 * @param {Element} el
 * @api public
 */

function SwipePane(el) {
  if (!(this instanceof SwipePane)) return new SwipePane(el);
  if (!el) throw new TypError('SwipePane requires an element');
  this.el = el;
  this.content = this.el.children[0];
  this.duration(300);
  this.bind();
  this.position = { x: 0, y: 0 };
};

/**
 * Mixin `Emitter`.
 */

Emitter(SwipePane.prototype);

/**
 * Bind event handlers.
 *
 * @api public
 */

SwipePane.prototype.bind = function () {
  this.events = events(this.content, this);
  this.events.bind('mousedown', 'ontouchstart');
  this.events.bind('touchstart');
  this.events.bind('touchmove');

  this.docEvents = events(document, this);
  this.docEvents.bind('mousemove', 'ontouchmove');
  this.docEvents.bind('mouseup', 'ontouchend');
  this.docEvents.bind('touchend');
};

/**
 * Unbind event handlers.
 *
 * @api public
 */

SwipePane.prototype.unbind = function () {
  this.events.unbind();
  this.docEvents.unbind();
};

/**
 * Handle touchstart.
 *
 * @api private
 */

SwipePane.prototype.ontouchstart = function (e) {
  e.stopPropagation();
  if (e.touches) e = e.touches[0];

  this.transitionDuration(0);

  var bounds = this.el.getBoundingClientRect();
  var contentBounds = this.content.getBoundingClientRect();

  this.contentX = contentBounds.left - bounds.left;
  this.contentY = contentBounds.top - bounds.top;

  // this.difX = bounds.width - contentBounds.width;
  // this.difY = bounds.height - contentBounds.height;
  var w = window.getComputedStyle(this.el).getPropertyValue('width');
  var h = window.getComputedStyle(this.el).getPropertyValue('height');
  var cW = window.getComputedStyle(this.content).getPropertyValue('width');
  var cH = window.getComputedStyle(this.content).getPropertyValue('height');
  this.difX = parseFloat(w) - parseFloat(cW);
  this.difY = parseFloat(h) - parseFloat(cH);

  this.swipe = {
    x: e.pageX,
    y: e.pageY,
    dx: 0,
    dy: 0,
    at: new Date
  };

  this.emit('start', { x: this.swipe.x, y: this.swipe.y });
};

/**
 * Handle touchmove.
 *
 * For the first and last slides
 * we apply some resistence to help
 * indicate that you're at the edges.
 *
 * @api private
 */

SwipePane.prototype.ontouchmove = function (e) {
  if (!this.swipe) return;
  if (e.touches && e.touches.length > 1) return;
  if (e.touches) {
    var ev = e;
    e = e.touches[0];
  }

  var s = this.swipe;
  var x = e.pageX;
  var y = e.pageY;
  s.dx = x - s.x;
  s.dy = y - s.y;

    // lock x
  if (this.difX == 0) {
    s.dx = 0;
  }
  // lock y
  if (this.difY == 0) {
    s.dy = 0;
  }

  // when we overwrite touch event with e.touches[0], it doesn't
  // have the preventDefault method. e.preventDefault() prevents
  // multiaxis scrolling when moving from left to right
  (ev || e).preventDefault();

  // position
  var px = s.dx + this.contentX;
  var py = s.dy + this.contentY;

  // resistance left
  if (px > 0) {
    px += px * -0.5;
  }
  // resistance right
  if (px < this.difX) {
    px += (this.difX - px) * 0.5;
  }
  // resistance top
  if (py > 0) {
    py += py * -0.5;
  }
  // resistance bottom
  if (py < this.difY) {
    py += (this.difY - py) * 0.5;
  }

  this.translate(px, py);

  // update position
  this.position = { x: px, y: py };

  this.emit('swipe', { x: px, y: py });
};

/**
 * Handle touchend.
 *
 * @api private
 */

SwipePane.prototype.ontouchend = function (e) {
  if (!this.swipe) return;
  e.stopPropagation();

  // touches
  if (e.changedTouches) e = e.changedTouches[0];

  // setup
  var s = this.swipe;
  var px = s.dx + this.contentX;
  var py = s.dy + this.contentY;

  px = min(0, max(px, this.difX));
  py = min(0, max(py, this.difY));

  this.transitionDuration(this._duration);
  this.translate(px, py);

  // clear
  this.swipe = null;

  // store position
  this.position = { x: px, y: py };

  this.emit('end', { x: px, y: py });
};

/**
 * Set transition duration to `ms`.
 *
 * @param {Number} ms
 * @return {SwipePane} self
 * @api public
 */

SwipePane.prototype.duration = function (ms) {
  this._duration = ms;
  return this;
};

/**
 * Set transition duration to `ms`.
 *
 * @param {Number} ms
 * @return {SwipePane} self
 * @api public
 */

SwipePane.prototype.duration = function (ms) {
  this._duration = ms;
  return this;
};

/**
 * Force redraw.
 *
 * @api public
 */

SwipePane.prototype.redraw = function () {
  translate(this.content, this.position.x, this.position.y);
};

/**
 * Set transition duration.
 *
 * @api private
 */

SwipePane.prototype.transitionDuration = function (ms) {
  var s = this.content.style;
  s.webkitTransition = ms + 'ms -webkit-transform';
  s.MozTransition = ms + 'ms -moz-transform';
  s.msTransition = ms + 'ms -ms-transform';
  s.OTransition = ms + 'ms -o-transform';
  s.transition = ms + 'ms transform';
};

/**
 * Translate to `x` and `y`.
 *
 * @api private
 */

SwipePane.prototype.translate = function (x, y) {
  translate(this.content, x, y);
};
