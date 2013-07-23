
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", Function("exports, require, module",
"\n/**\n * Expose `Emitter`.\n */\n\nmodule.exports = Emitter;\n\n/**\n * Initialize a new `Emitter`.\n *\n * @api public\n */\n\nfunction Emitter(obj) {\n  if (obj) return mixin(obj);\n};\n\n/**\n * Mixin the emitter properties.\n *\n * @param {Object} obj\n * @return {Object}\n * @api private\n */\n\nfunction mixin(obj) {\n  for (var key in Emitter.prototype) {\n    obj[key] = Emitter.prototype[key];\n  }\n  return obj;\n}\n\n/**\n * Listen on the given `event` with `fn`.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.on = function(event, fn){\n  this._callbacks = this._callbacks || {};\n  (this._callbacks[event] = this._callbacks[event] || [])\n    .push(fn);\n  return this;\n};\n\n/**\n * Adds an `event` listener that will be invoked a single\n * time then automatically removed.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.once = function(event, fn){\n  var self = this;\n  this._callbacks = this._callbacks || {};\n\n  function on() {\n    self.off(event, on);\n    fn.apply(this, arguments);\n  }\n\n  fn._off = on;\n  this.on(event, on);\n  return this;\n};\n\n/**\n * Remove the given callback for `event` or all\n * registered callbacks.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.off =\nEmitter.prototype.removeListener =\nEmitter.prototype.removeAllListeners = function(event, fn){\n  this._callbacks = this._callbacks || {};\n\n  // all\n  if (0 == arguments.length) {\n    this._callbacks = {};\n    return this;\n  }\n\n  // specific event\n  var callbacks = this._callbacks[event];\n  if (!callbacks) return this;\n\n  // remove all handlers\n  if (1 == arguments.length) {\n    delete this._callbacks[event];\n    return this;\n  }\n\n  // remove specific handler\n  var i = callbacks.indexOf(fn._off || fn);\n  if (~i) callbacks.splice(i, 1);\n  return this;\n};\n\n/**\n * Emit `event` with the given args.\n *\n * @param {String} event\n * @param {Mixed} ...\n * @return {Emitter}\n */\n\nEmitter.prototype.emit = function(event){\n  this._callbacks = this._callbacks || {};\n  var args = [].slice.call(arguments, 1)\n    , callbacks = this._callbacks[event];\n\n  if (callbacks) {\n    callbacks = callbacks.slice(0);\n    for (var i = 0, len = callbacks.length; i < len; ++i) {\n      callbacks[i].apply(this, args);\n    }\n  }\n\n  return this;\n};\n\n/**\n * Return array of callbacks for `event`.\n *\n * @param {String} event\n * @return {Array}\n * @api public\n */\n\nEmitter.prototype.listeners = function(event){\n  this._callbacks = this._callbacks || {};\n  return this._callbacks[event] || [];\n};\n\n/**\n * Check if this emitter has `event` handlers.\n *\n * @param {String} event\n * @return {Boolean}\n * @api public\n */\n\nEmitter.prototype.hasListeners = function(event){\n  return !! this.listeners(event).length;\n};\n//@ sourceURL=component-emitter/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"\n/**\n * Bind `el` event `type` to `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.bind = function(el, type, fn, capture){\n  if (el.addEventListener) {\n    el.addEventListener(type, fn, capture || false);\n  } else {\n    el.attachEvent('on' + type, fn);\n  }\n  return fn;\n};\n\n/**\n * Unbind `el` event `type`'s callback `fn`.\n *\n * @param {Element} el\n * @param {String} type\n * @param {Function} fn\n * @param {Boolean} capture\n * @return {Function}\n * @api public\n */\n\nexports.unbind = function(el, type, fn, capture){\n  if (el.removeEventListener) {\n    el.removeEventListener(type, fn, capture || false);\n  } else {\n    el.detachEvent('on' + type, fn);\n  }\n  return fn;\n};\n//@ sourceURL=component-event/index.js"
));
require.register("component-event-manager/index.js", Function("exports, require, module",
"\n\n/**\n * Expose `EventManager`.\n */\n\nmodule.exports = EventManager;\n\n/**\n * Initialize an `EventManager` with the given\n * `target` object which events will be bound to,\n * and the `obj` which will receive method calls.\n *\n * @param {Object} target\n * @param {Object} obj\n * @api public\n */\n\nfunction EventManager(target, obj) {\n  this.target = target;\n  this.obj = obj;\n  this._bindings = {};\n}\n\n/**\n * Register bind function.\n *\n * @param {Function} fn\n * @return {EventManager} self\n * @api public\n */\n\nEventManager.prototype.onbind = function(fn){\n  this._bind = fn;\n  return this;\n};\n\n/**\n * Register unbind function.\n *\n * @param {Function} fn\n * @return {EventManager} self\n * @api public\n */\n\nEventManager.prototype.onunbind = function(fn){\n  this._unbind = fn;\n  return this;\n};\n\n/**\n * Bind to `event` with optional `method` name.\n * When `method` is undefined it becomes `event`\n * with the \"on\" prefix.\n *\n *    events.bind('login') // implies \"onlogin\"\n *    events.bind('login', 'onLogin')\n *\n * @param {String} event\n * @param {String} [method]\n * @return {Function} callback\n * @api public\n */\n\nEventManager.prototype.bind = function(event, method){\n  var fn = this.addBinding.apply(this, arguments);\n  if (this._onbind) this._onbind(event, method, fn);\n  this._bind(event, fn);\n  return fn;\n};\n\n/**\n * Add event binding.\n *\n * @param {String} event\n * @param {String} method\n * @return {Function} callback\n * @api private\n */\n\nEventManager.prototype.addBinding = function(event, method){\n  var obj = this.obj;\n  var method = method || 'on' + event;\n  var args = [].slice.call(arguments, 2);\n\n  // callback\n  function callback() {\n    var a = [].slice.call(arguments).concat(args);\n    obj[method].apply(obj, a);\n  }\n\n  // subscription\n  this._bindings[event] = this._bindings[event] || {};\n  this._bindings[event][method] = callback;\n\n  return callback;\n};\n\n/**\n * Unbind a single binding, all bindings for `event`,\n * or all bindings within the manager.\n *\n *     evennts.unbind('login', 'onLogin')\n *     evennts.unbind('login')\n *     evennts.unbind()\n *\n * @param {String} [event]\n * @param {String} [method]\n * @return {Function} callback\n * @api public\n */\n\nEventManager.prototype.unbind = function(event, method){\n  if (0 == arguments.length) return this.unbindAll();\n  if (1 == arguments.length) return this.unbindAllOf(event);\n  var fn = this._bindings[event][method];\n  if (this._onunbind) this._onunbind(event, method, fn);\n  this._unbind(event, fn);\n  return fn;\n};\n\n/**\n * Unbind all events.\n *\n * @api private\n */\n\nEventManager.prototype.unbindAll = function(){\n  for (var event in this._bindings) {\n    this.unbindAllOf(event);\n  }\n};\n\n/**\n * Unbind all events for `event`.\n *\n * @param {String} event\n * @api private\n */\n\nEventManager.prototype.unbindAllOf = function(event){\n  var bindings = this._bindings[event];\n  if (!bindings) return;\n  for (var method in bindings) {\n    this.unbind(event, method);\n  }\n};\n//@ sourceURL=component-event-manager/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Manager = require('event-manager')\n  , event = require('event');\n\n/**\n * Return a new event manager.\n */\n\nmodule.exports = function(target, obj){\n  var manager = new Manager(target, obj);\n\n  manager.onbind(function(name, fn){\n    event.bind(target, name, fn);\n  });\n\n  manager.onunbind(function(name, fn){\n    event.unbind(target, name, fn);\n  });\n\n  return manager;\n};\n//@ sourceURL=component-events/index.js"
));
require.register("component-has-translate3d/index.js", Function("exports, require, module",
"\nvar prop = require('transform-property');\n// IE8<= doesn't have `getComputedStyle`\nif (!prop || !window.getComputedStyle) return module.exports = false;\n\nvar map = {\n  webkitTransform: '-webkit-transform',\n  OTransform: '-o-transform',\n  msTransform: '-ms-transform',\n  MozTransform: '-moz-transform',\n  transform: 'transform'\n};\n\n// from: https://gist.github.com/lorenzopolidori/3794226\nvar el = document.createElement('div');\nel.style[prop] = 'translate3d(1px,1px,1px)';\ndocument.body.insertBefore(el, null);\nvar val = getComputedStyle(el).getPropertyValue(map[prop]);\ndocument.body.removeChild(el);\nmodule.exports = null != val && val.length && 'none' != val;\n//@ sourceURL=component-has-translate3d/index.js"
));
require.register("component-transform-property/index.js", Function("exports, require, module",
"\nvar styles = [\n  'webkitTransform',\n  'MozTransform',\n  'msTransform',\n  'OTransform',\n  'transform'\n];\n\nvar el = document.createElement('p');\nvar style;\n\nfor (var i = 0; i < styles.length; i++) {\n  style = styles[i];\n  if (null != el.style[style]) {\n    module.exports = style;\n    break;\n  }\n}\n//@ sourceURL=component-transform-property/index.js"
));
require.register("component-translate/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar transform = require('transform-property');\nvar has3d = require('has-translate3d');\n\n/**\n * Expose `translate`.\n */\n\nmodule.exports = translate;\n\n/**\n * Translate `el` by `(x, y)`.\n *\n * @param {Element} el\n * @param {Number} x\n * @param {Number} y\n * @api public\n */\n\nfunction translate(el, x, y){\n  if (transform) {\n    if (has3d) {\n      el.style[transform] = 'translate3d(' + x + 'px,' + y + 'px, 0)';\n    } else {\n      el.style[transform] = 'translate(' + x + 'px,' + y + 'px)';\n    }\n  } else {\n    el.style.left = x;\n    el.style.top = y;\n  }\n};\n//@ sourceURL=component-translate/index.js"
));
require.register("swipe-pane/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar Emitter = require('emitter');\nvar translate = require('translate');\nvar events = require('events');\nvar min = Math.min;\nvar max = Math.max;\n\n/**\n * Expose `SwipePane`.\n */\n\nmodule.exports = SwipePane;\n\n/**\n * Turn `el` into a scrollable element.\n *\n * @param {Element} el\n * @api public\n */\n\nfunction SwipePane(el) {\n  if (!(this instanceof SwipePane)) return new SwipePane(el);\n  if (!el) throw new TypError('SwipePane requires an element');\n  this.el = el;\n  this.content = this.el.children[0];\n  this.duration(300);\n  this.bind();\n};\n\n/**\n * Mixin `Emitter`.\n */\n\nEmitter(SwipePane.prototype);\n\n/**\n * Bind event handlers.\n *\n * @api public\n */\n\nSwipePane.prototype.bind = function () {\n  this.events = events(this.content, this);\n  this.events.bind('mousedown', 'ontouchstart');\n  this.events.bind('mousemove', 'ontouchmove');\n  this.events.bind('touchstart');\n  this.events.bind('touchmove');\n\n  this.docEvents = events(document, this);\n  this.docEvents.bind('mouseup', 'ontouchend');\n  this.docEvents.bind('touchend');\n};\n\n/**\n * Unbind event handlers.\n *\n * @api public\n */\n\nSwipePane.prototype.unbind = function () {\n  this.events.unbind();\n  this.docEvents.unbind();\n};\n\n/**\n * Handle touchstart.\n *\n * @api private\n */\n\nSwipePane.prototype.ontouchstart = function (e) {\n  e.stopPropagation();\n  if (e.touches) e = e.touches[0];\n\n  this.transitionDuration(0);\n\n  var bounds = this.el.getBoundingClientRect();\n  var contentBounds = this.content.getBoundingClientRect();\n\n  this.contentX = contentBounds.left - bounds.left;\n  this.contentY = contentBounds.top - bounds.top;\n\n  this.difX = bounds.width - contentBounds.width;\n  this.difY = bounds.height - contentBounds.height;\n  \n  console.log('this.difX', this.difX);\n\n  this.swipe = {\n    x: e.pageX,\n    y: e.pageY,\n    dx: 0,\n    dy: 0,\n    at: new Date\n  };\n\n  this.emit('start', { x: this.swipe.x, y: this.swipe.y });\n};\n\n/**\n * Handle touchmove.\n *\n * For the first and last slides\n * we apply some resistence to help\n * indicate that you're at the edges.\n *\n * @api private\n */\n\nSwipePane.prototype.ontouchmove = function (e) {\n  if (!this.swipe) return;\n  if (e.touches && e.touches.length > 1) return;\n  if (e.touches) {\n    var ev = e;\n    e = e.touches[0];\n  }\n\n  var s = this.swipe;\n  var x = e.pageX;\n  var y = e.pageY;\n  s.dx = x - s.x;\n  s.dy = y - s.y;\n\n    // lock x\n  if (this.difX == 0) {\n    s.dx = 0;\n  }\n  // lock y\n  if (this.difY == 0) {\n    s.dy = 0;\n  }\n\n  // when we overwrite touch event with e.touches[0], it doesn't\n  // have the preventDefault method. e.preventDefault() prevents\n  // multiaxis scrolling when moving from left to right\n  (ev || e).preventDefault();\n\n  // position\n  var px = s.dx + this.contentX;\n  var py = s.dy + this.contentY;\n\n  // resistance left\n  if (px > 0) {\n    px += px * -0.5;\n  }\n  // resistance right\n  if (px < this.difX) {\n    px += (this.difX - px) * 0.5;\n  }\n  // resistance top\n  if (py > 0) {\n    py += py * -0.5;\n  }\n  // resistance bottom\n  if (py < this.difY) {\n    py += (this.difY - py) * 0.5;\n  }\n\n  this.translate(px, py);\n\n  this.emit('swipe', { x: px, y: py });\n};\n\n/**\n * Handle touchend.\n *\n * @api private\n */\n\nSwipePane.prototype.ontouchend = function (e) {\n  if (!this.swipe) return;\n  e.stopPropagation();\n\n  // touches\n  if (e.changedTouches) e = e.changedTouches[0];\n\n  // setup\n  var s = this.swipe;\n  var px = s.dx + this.contentX;\n  var py = s.dy + this.contentY;\n\n  px = min(0, max(px, this.difX));\n  py = min(0, max(py, this.difY));\n\n  this.transitionDuration(this._duration);\n  this.translate(px, py);\n\n  // clear\n  this.swipe = null;\n\n  this.emit('end', { x: px, y: py });\n};\n\n/**\n * Set transition duration to `ms`.\n *\n * @param {Number} ms\n * @return {SwipePane} self\n * @api public\n */\n\nSwipePane.prototype.duration = function (ms) {\n  this._duration = ms;\n  return this;\n};\n\n/**\n * Set transition duration to `ms`.\n *\n * @param {Number} ms\n * @return {SwipePane} self\n * @api public\n */\n\nSwipePane.prototype.duration = function (ms) {\n  this._duration = ms;\n  return this;\n};\n\n/**\n * Set transition duration.\n *\n * @api private\n */\n\nSwipePane.prototype.transitionDuration = function (ms) {\n  var s = this.content.style;\n  s.webkitTransition = ms + 'ms -webkit-transform';\n  s.MozTransition = ms + 'ms -moz-transform';\n  s.msTransition = ms + 'ms -ms-transform';\n  s.OTransition = ms + 'ms -o-transform';\n  s.transition = ms + 'ms transform';\n};\n\n/**\n * Translate to `x` and `y`.\n *\n * @api private\n */\n\nSwipePane.prototype.translate = function (x, y) {\n  translate(this.content, x, y);\n};//@ sourceURL=swipe-pane/index.js"
));
require.alias("component-emitter/index.js", "swipe-pane/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-events/index.js", "swipe-pane/deps/events/index.js");
require.alias("component-events/index.js", "events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("component-translate/index.js", "swipe-pane/deps/translate/index.js");
require.alias("component-translate/index.js", "swipe-pane/deps/translate/index.js");
require.alias("component-translate/index.js", "translate/index.js");
require.alias("component-has-translate3d/index.js", "component-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "component-translate/deps/transform-property/index.js");

require.alias("component-translate/index.js", "component-translate/index.js");

