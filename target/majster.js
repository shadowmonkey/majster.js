(function() {
  var Interval, Majster, Notify, app, isArray, isFunction, isString, isUndefined;

  isUndefined = function(x) {
    return x == null;
  };

  isFunction = function(x) {
    return x && {}.toString.call(x) === '[object Function]';
  };

  isArray = function(x) {
    return x && {}.toString.call(x) === '[object Array]';
  };

  isString = function(x) {
    return x && {}.toString.call(x) === '[object String]';
  };

  Majster = (function() {
    var attributes, map, parameters, widgets;

    function Majster() {}

    widgets = {};

    attributes = {};

    Majster.prototype.controller = function(widgetId, arg1, arg2) {
      var callback, params;
      callback = isFunction(arg1) ? arg1 : arg2;
      params = isArray(arg1) ? arg1 : [];
      if (isUndefined(widgetId)) {
        throw 'first parameter (widgetId) is not defined';
      }
      if (!isFunction(callback)) {
        throw "callback is not a function. widgetId " + widgetId;
      }
      if (!isUndefined(widgets[widgetId])) {
        throw "widgetId " + widgetId + " already defined";
      }
      widgets[widgetId] = {
        callback: callback,
        params: params,
        name: widgetId,
        type: 'widget'
      };
      return this;
    };

    Majster.prototype.task = function(name, arg1, arg2) {
      var callback, params;
      if (widgets["majster:task:" + name]) {
        throw "task is already defined: " + name;
      }
      if (isString(arg1)) {
        params = [arg1];
      }
      if (isArray(arg1)) {
        params = arg1;
      }
      if (isFunction(arg1)) {
        params = [];
      }
      if (isFunction(arg1)) {
        callback = arg1;
      }
      if (isFunction(arg2)) {
        callback = arg2;
      }
      if (isUndefined(callback)) {
        throw 'task not defined';
      }
      widgets["majster:task:" + name] = {
        callback: callback,
        params: params,
        name: name,
        type: 'task'
      };
      return this;
    };

    Majster.prototype.set = function(name, callback) {
      if (name === '$data' || name === '$element') {
        throw "Name restricted for framework " + name;
      }
      attributes[name] = callback;
      return this;
    };

    Majster.prototype.scan = function($element) {
      var $child, child, j, len, ref;
      if (!isUndefined($element.attr('widget'))) {
        map($element, $element.attr('widget'));
      }
      ref = $element.find('[widget]');
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        $child = $(child);
        map($child, $child.attr('widget'));
      }
      return this;
    };

    Majster.prototype.run = function(taskName) {
      var i, widget;
      if (isUndefined(taskName)) {
        for (i in widgets) {
          widget = widgets[i];
          if (widget.type === 'task') {
            this.run(widget.name);
          }
        }
      } else {
        if (isUndefined(widgets["majster:task:" + taskName])) {
          throw "Task not defined " + taskName;
        }
        map($(document), "majster:task:" + taskName);
      }
      return this;
    };

    parameters = function($element, $attr) {
      var attr, j, len, param, params;
      params = [];
      for (j = 0, len = $attr.length; j < len; j++) {
        attr = $attr[j];
        param = (function() {
          switch (attr) {
            case '$element':
              return $element;
            case '$data':
              return $element.data();
            default:
              if (isUndefined(attributes[attr])) {
                throw "Attribute " + attr + " not found for widget";
              } else {
                return attributes[attr];
              }
          }
        })();
        params.push(param);
      }
      return params;
    };

    map = function($element, widgetId) {
      var callback, widget;
      widget = widgets[widgetId];
      if (isUndefined(widget)) {
        throw "widget " + widgetId + " not found";
      }
      callback = widget.callback;
      return callback.apply({}, parameters($element, widget.params));
    };

    return Majster;

  })();

  app = new Majster;

  window.app = app;

  $(function() {
    window.app.run();
    return window.app.scan($(document));
  });

  app.controller('auto-scan', ['$element'], function($component) {
    var MutationObserver, observer;
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    observer = new MutationObserver(function(mutations) {
      var j, len, mutation, node, results;
      results = [];
      for (j = 0, len = mutations.length; j < len; j++) {
        mutation = mutations[j];
        results.push((function() {
          var k, len1, ref, results1;
          ref = mutation.addedNodes;
          results1 = [];
          for (k = 0, len1 = ref.length; k < len1; k++) {
            node = ref[k];
            results1.push(app.scan($(node)));
          }
          return results1;
        })());
      }
      return results;
    });
    return observer.observe($component.get(0), {
      attributes: true,
      childList: true,
      subtree: true
    });
  });

  app.set('$delay', {
    call: function(time, callback) {
      return setTimeout(callback, time);
    }
  });

  Interval = (function() {
    var intervals;

    function Interval() {}

    intervals = {};

    Interval.prototype.start = function(name) {
      if (intervals[name] == null) {
        throw "Interval not defined: " + name + ". Can't start";
      }
      if (intervals[name].interval != null) {
        throw "Interval is running " + name + ". Can't start again";
      }
      intervals[name].interval = setInterval(intervals[name].callback, intervals[name].time);
      return this;
    };

    Interval.prototype.set = function(name, time, callback) {
      if ((intervals[name] != null) && (intervals[name].interval != null)) {
        throw "Interval " + name + " is running. Stop first to change";
      }
      intervals[name] = {
        callback: callback,
        time: time,
        interval: null
      };
      return this;
    };

    Interval.prototype.stop = function(name) {
      if (intervals[name] == null) {
        throw "Interval not defined: " + name + " . Can't stop.";
      }
      if (intervals[name].interval == null) {
        throw "Interval is not started " + name;
      }
      clearInterval(intervals[name].interval);
      intervals[name].interval = null;
      return this;
    };

    return Interval;

  })();

  app.set('$interval', new Interval);

  Notify = (function() {
    var listeners;

    function Notify() {}

    listeners = {};

    Notify.prototype.listen = function(name, callback) {
      if (isUndefined(listeners[name])) {
        listeners[name] = {
          callbacks: []
        };
      }
      listeners[name].callbacks.push(callback);
      return this;
    };

    Notify.prototype.send = function(name, params) {
      var callback, j, len, ref;
      if (!isUndefined(listeners[name])) {
        ref = listeners[name].callbacks;
        for (j = 0, len = ref.length; j < len; j++) {
          callback = ref[j];
          callback(params);
        }
      }
      return this;
    };

    return Notify;

  })();

  app.set('$notify', new Notify);

}).call(this);
