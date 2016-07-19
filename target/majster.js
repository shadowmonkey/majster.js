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
    },
    generateUUID : function() {
        return Math.random().toString(36).substr(2, 9);
    }
};

window.app = new function() {
     var widgets = {};
     var mappings = {};
     var $params = {};
     var $tasks = [];
     var initFunction = function() {}

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

         var uid = js.generateUUID();

         $element.attr('widget-init', true);
         $element.attr('widget-uid', uid);

         callback.apply({}, params);

         mappings[id + uid] = {
             uid : uid,
             widgetId : id,
             element  : $element,
             callback : callback
         };
     };

     var remove = function($element) {
        var widgetId = $element.attr('widget');
        var uid = $element.attr('widget-uid');
        var key = widgetId + uid;

        if(js.isDefined(mappings[key])) {
            mappings[key].callback = function() {};
        } else {
            throw new 'Element is not under framework control';
        }
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
            if(js.isUndefined($this.attr('widget-init'))) {
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
            initFunction();
            invokeWidgets($(document));
            invokeTasks();
         });
     };

     var public = {
        setUp : function(callback) {
            initFunction = callback;
            return public;
        },
        set : function(name , callback) {
           if(name === '$data' || name === '$element') {
              throw 'Name restricted for framework: ' + $name;
           }
           $params[name] = callback;
           return public;
        },
        define : function(name, callback) {
            callback($params[name]);
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
        scan : invokeWidgets,
        remove : remove
     };

     ready();
     return public;
}()
.set('$notify', new function() {
  var listeners = {};

  var public =  {
      listen : function(name, callback) {
          if(js.isUndefined(listeners[name])) {
              listeners[name] = { callbacks : [] };
          }
          listeners[name].callbacks.push(callback);
          return public;
      },
      send : function(name, params) {
          if(js.isDefined(listeners[name])) {
              $.each(listeners[name].callbacks, function(i, callback) {
                  callback(params);
              });
          }
          return public;
      }
  };

  return public;
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
        if(js.isFunction(definition.message)) {
            websocket.onmessage = definition.message;
        }
        if(js.isFunction(definition.close)) {
            websocket.onclose = function() {
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
.set('$form', function () {
  var rules = {};
  return {
      bind : function($element) {
          var saved = {};
          var validation = {};
          var callbacks = {
              valid : function() {},
              invalid : function() {}
          };

          var trigger = function() {
              var valid = true;
              $.each(validation, function(selector, val) {
                  if(!val) {
                      valid = false;
                  }
              });
              if(valid) {
                  callbacks.valid();
              } else {
                  callbacks.invalid();
              }
          };

          var handleSuccess= function($target, arg) {
              if(js.isDefined(arg.success)) {
                  arg.success($target);
              }
              if(js.isDefined(arg.errorClass)) {
                  $target.removeClass(arg.errorClass);
              }

          };

          var handleFailure = function($target, arg, obj) {
              if(js.isDefined(arg.errorLabel) && js.isDefined(obj.message)) {
                  if(_.isFunction(arg.errorLabel)) {
                      arg.errorLabel($target).text(obj.message);
                  } else {
                      $element.find(arg.errorLabel).text(obj.message);
                  }
              }
              if(js.isDefined(arg.errorClass)) {
                  $target.addClass(arg.errorClass);
              }
              if(js.isDefined(arg.error)) {
                  arg.error($target);
              }
          };

          var apply = function($target, name, arg, selector) {
              if(js.isDefined(arg[name])) {
                  $target.on(name, function() {
                      $.each(arg[name], function(i, obj) {
                          var result = rules[obj.rule]($target, obj);
                          if(result) {
                              validation[selector] = true;
                              handleSuccess($target, arg);
                          } else {
                              validation[selector] = false;
                              if(js.isUndefined(obj.silent) || !obj.silent) {
                                  handleFailure($target, arg, obj);
                              }
                          }
                          trigger();
                      });
                  });
              }
          };

          var public = {
              apply : function(selector, arg) {
                  var formElement = $element.find(selector);
                  if(!formElement) {
                      throw 'Can\'t find element with selector ' + selector;
                  }

                  validation[selector] = false;

                  if(js.isDefined(arg.extend)) {
                      arg.extend(formElement);
                  }

                  apply(formElement, 'click', arg, selector);
                  apply(formElement, 'blur', arg, selector);
                  apply(formElement, 'change', arg, selector);
                  apply(formElement, 'focus', arg, selector);
                  apply(formElement, 'hover', arg, selector);
                  apply(formElement, 'keydown', arg, selector);
                  apply(formElement, 'keyup', arg, selector);
                  apply(formElement, 'mouseleave', arg, selector);
                  apply(formElement, 'change', arg, selector);

                  saved[selector] = { obj : formElement, arg: arg };

                  return public;
              },

              clean : function(selector) {
                  var data = saved[selector];
                  handleSuccess(data.obj, data.arg);
              },

              ifValid : function(callback) {
                  callbacks.valid = callback;
                  return public;
              },

              ifInvalid : function(callback) {
                  callbacks.invalid = callback;
                  return public;
              }
          };

          return public;
      },

      define : function(name, callback) {
          if(js.isUndefined(rules[name])) {
              rules[name] = callback;
          } else {
              throw 'Rule is already defined';
          }
      }
  }
}())
.controller('auto-scan', ['$element'], function($component) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(function(mutations) {
    	$.each(mutations, function(index, mutation) {
    		$.each(mutation.addedNodes, function(i, element) {
    		    $element = $(element);
    		    app.scan($element);
    		});
    		$.each(mutation.removedNodes, function(i, element) {
                $element = $(element);
                if(js.isDefined($element.attr('widget'))) {
                    app.remove($element);
                }
                $element.find('[widget]').each(function() {
                    app.remove($(this));
                });
            });

    	});
    });

    observer.observe($component.get(0), { attributes: true, childList: true, subtree : true });
});

var app = window.app;
