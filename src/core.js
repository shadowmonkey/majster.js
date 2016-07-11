var js = {
    isString : function(val) {
        return $.type(val) === 'string';
    },
    isUndefined : function(val) {
        return val === void 0;
    },
    isDefined : function(val) {
        return !js.isUndefined(val);
    },
    isFunction : function(val) {
          return $.type(val) === 'function';
    },
    isNotFunction : function(val) {
          return !js.isFunction(val);
    }
};

window.app = new function() {
     var widgets = {};
     var mappings = [];
     var $params = {};
     var $tasks = [];

     var processParams = function($element, $widgetParams) {
         var params = [];

         $.each($widgetParams, function(i, param) {
             switch(param) {
                 case '$element' :
                     params.push($element);
                     break;
                 case '$data' :
                     params.push($element.data());
                     break;
                 default :
                    if(js.isUndefined($params[param])) {
                        throw 'Attribute ' + param + ' not found for widget';
                    } else {
                        params.push($params[param]);
                    }
             }
         });

         return params;
     };

     var mapping = function($element, id) {
         var widget = widgets[id];
         var callback = widget.callback;
         var params = processParams($element, widget.params);

         $element.data('init', true);
         callback.apply({}, params);

         mappings.push({
             widgetId : id,
             element  : $element,
             callback : callback
         });
     };

     var proceedView = function(val) {
         switch (val) {
             case 'underscore' :
                 return new UnderscoreJSTView();
         }
     };

     var invokeWidgets = function($element) {
         if(js.isDefined($element.attr('widget'))) {
            mapping($element, $element.attr('widget'))
         }

         $element.find('[widget]').each(function() {
            var $this = $(this);
            if(js.isUndefined($this.data('init'))) {
                var widgetId = $this.attr('widget');
                mapping($this, widgetId);
            }
         });
     };

     var invokeTasks = function() {
        $.each($tasks, function(i, $task) {
            var params = [];
            $.each($task.params, function(i, param) {
                if(js.isUndefined($params[param])) {
                    throw 'Attribute ' + param + ' not found for widget';
                } else {
                    params.push($params[param]);
                }
            });
            var callback = $task.callback;
            callback.apply({}, params);
            $task.invoke = callback;
        });
     };

     var ready = function() {
         $(document).ready(function() {
            invokeWidgets($(document));
            invokeTasks();
         });
     };

     var public = {
        set : function(name , callback) {
           if(name === '$data' || name === '$element') {
              throw 'Name restricted for framework: ' + $name;
           }
           $params[name] = callback;
           return public;
        },
        controller : function(widgetId, params, callback) {
           if(js.isUndefined(widgetId)) {
               throw 'widgetId is not defined';
           }
           if(js.isNotFunction(callback)) {
               throw 'class is undefined or is not function';
           }
           if(js.isDefined(widgets[widgetId])) {
               throw 'widgetId is already defined: ' + widgetId;
           }
           widgets[widgetId] = { callback : callback, params : params } ;
           return public;
        },
        task : function(params, callback) {
            $tasks.push({params : params, callback : callback});
            return public;
        },
        scan : invokeWidgets
     };

     ready();
     return public;
}()
.set('$notify', new function() {
  var listeners = {};

  return {
      listen : function(name, callback) {
          if(js.isUndefined(listeners[name])) {
              listeners[name] = { callbacks : [] };
          }
          listeners[name].callbacks.push(callback);
      },
      send : function(name, params) {
          if(js.isDefined(listeners[name])) {
              $.each(listeners[name].callbacks, function(i, callback) {
                  callback(params);
              });
          }
      }
  };
}())
.set('$delay', {
    call : function(time, callback) {
        setTimeout(callback, time);
    }
})
.set('$interval', new function() {
    var intervals = {};
    var start = function(name) {
         if(js.isDefined(intervals[name])) {
            intervals[name].interval = setInterval(intervals[name].callback, intervals[name].time);
         } else {
            throw 'Interval not defined: ' + name + '. Can\'t start.';
         }
    };
    return {
        set : function(name, time, callback) {
            intervals[name] = { callback : callback, time :  time, interval : undefined };
            return {
                start : function() {
                    start(name);
                }
            };
        },
        start : start,
        stop : function(name) {
            if(js.isDefined(intervals[name])) {
                clearInterval(intervals[name].interval);
            } else {
                throw 'Interval not defined: ' + name + '. Can\'t stop.';
            }
        }
    };
}())
.set('$websocket', new function(){
    var websockets = {};

    var start = function(name) {
        var definition = websockets[name];
        if(js.isUndefined(definition)) {
            throw 'Can\'t start websocket: ' + name + '. No definition found';
        }
        if(definition.started) {
            throw 'Can\'t start websocket: ' + name + '. Already started';
        }

        var websocket = new WebSocket(definition.url, definition.protocols);
        if(js.isFunction(definition.open)) {
            websockets[name].started = start;
            websocket.onopen = definition.open;
        }
        if(js.isFunction(definition.open)) {
            websocket.onmessage = definition.message;
        }
        if(js.isFunction(definition.open)) {
            websocket.close = function() {
                 websockets[name].started = false;
                 definition.close();
            };
        }
        websockets[name].websocket = websocket;
    };
    return {
        define : function(name, url, protocols) {
            if (!("WebSocket" in window)) {
                throw 'WebSocket is not supported by browser';
            }

            if(js.isDefined(websockets[name])) {
                throw 'Websocket ' + name + " is already defined";
            }

            websockets[name] = { url : url, protocols : protocols, started : false };

            var action = {
                on : function(name, callback) {
                    switch(name) {
                        case 'open' :
                            action.open(callback);
                            break;
                        case 'message' :
                            action.message(callback);
                            break;
                        case 'close' :
                            action.message(callback);
                            break;
                        case 'error' :
                            action.error(callback);
                            break;
                        default:
                            throw 'Action ' + name + ' not found on $websocket';
                    }
                    return action;
                },
                open : function(callback) {
                    websockets[name]['open'] = callback;
                    return action;
                },
                message : function(callback) {
                    websockets[name]['message'] = callback;
                    return action;
                },
                close : function(callback) {
                    websockets[name]['close'] = callback;
                    return action;
                },
                error : function(callback) {
                    websockets[name]['error'] = callback;
                    return action;
                },
                start : function() {
                    start(name);
                }
            };
            return action;
        },
        start : start,
        send : function(name, object) {
            var websocket = websockets[name];
            if(js.isUndefined(websocket)) {
                throw 'Can\'t send message. Websocket: ' + name + ' not found';
            }
            if(!websocket.started) {
                throw 'Can\'t send message. Websocket: ' + name + ' is closed';
            }
            websockets[name].websocket.send(object);
        },
        close : function(name) {
            var websocket = websockets[name];
            if(js.isUndefined(websocket)) {
                throw 'Can\'t close websocket. Websocket: ' + name + ' not found';
            }
            if(!websocket.started) {
                throw 'Can\'t close websocket. Websocket: ' + name + ' is\'t started';
            }
            websockets[name].websocket.close();
        },
        get : function(name) {
            var websocket = websockets[name];
            if(js.isUndefined(websocket)) {
                throw 'Can\'t close websocket. Websocket: ' + name + ' not found';
            }
            return websocket;
        }
    };
}())
.controller('auto-scan', ['$element', '$interval', '$data'], function($component, $interval, $data) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(function(mutations) {
    	$.each(mutations, function(index, mutation) {
    		$.each(mutation.addedNodes, function(i, element) {
    		    $element = $(element);
    		    app.scan($element);
    		});
    	});
    });

    observer.observe($component.get(0), { attributes: true, childList: true, subtree : true });
});

var app = window.app;
