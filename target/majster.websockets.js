(function() {
  var WebSocketFacade,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  WebSocketFacade = (function() {
    var check, websockets;

    function WebSocketFacade() {}

    websockets = [];

    WebSocketFacade.prototype.send = function(name, object) {
      check(name);
      if (!websockets[name].started) {
        throw "Websocket " + name + " is closed";
      }
      websockets[name].websocket.send(object);
      return this;
    };

    WebSocketFacade.prototype.start = function(name) {
      var connection;
      check(name);
      if (websockets[name].started) {
        throw "Websocket " + name + " already started";
      }
      connection = new WebSocket(websockets[name].url, websockets[name].protocols);
      if (websockets[name].open && {}.toString.call(websockets[name].open) === '[object Function]') {
        connection.onopen = function() {
          websockets[name].started = true;
          return websockets[name].open();
        };
      }
      if (websockets[name].message && {}.toString.call(websockets[name].message) === '[object Function]') {
        connection.onmessage = websockets[name].message;
      }
      if (websockets[name].error && {}.toString.call(websockets[name].error) === '[object Function]') {
        connection.onerror = websockets[name].error;
      }
      if (websockets[name].close && {}.toString.call(websockets[name].close) === '[object Function]') {
        connection.onclose = function() {
          websockets[name].started = false;
          return websockets[name].close();
        };
      }
      websockets[name].websocket = connection;
      return this;
    };

    WebSocketFacade.prototype.close = function(name) {
      check(name);
      if (!websockets[name].started) {
        throw "Websocket " + name + " is closed already";
      }
      websockets[name].websocket.close();
      return this;
    };

    WebSocketFacade.prototype.get = function(name) {
      check(name);
      return websockets[name];
    };

    WebSocketFacade.prototype.define = function(name, url, protocols) {
      var action, ref;
      if (ref = !'WebSocket', indexOf.call(window, ref) >= 0) {
        throw 'WebSocket is not supported by browser';
      }
      if (websockets[name] != null) {
        throw "Websocket " + name + " is already defined";
      }
      websockets[name] = {
        url: url,
        protocols: protocols,
        started: false
      };
      return action = {
        on: function(name, callback) {
          switch (name) {
            case 'open':
              action.open(callback);
              break;
            case 'message':
              action.message(callback);
              break;
            case 'close':
              action.close(callback);
              break;
            case 'error':
              action.error(callback);
              break;
            default:
              throw "Action " + name + " not found on $websocket";
          }
          return action;
        },
        open: function(callback) {
          websockets[name]['open'] = callback;
          return action;
        },
        message: function(callback) {
          websockets[name]['message'] = callback;
          return action;
        },
        close: function(callback) {
          websockets[name]['close'] = callback;
          return action;
        },
        error: function(callback) {
          websockets[name]['error'] = callback;
          return action;
        }
      };
    };

    check = function(name) {
      if (name == null) {
        throw 'Name parameters is missing';
      }
      if (websockets[name] == null) {
        throw "Can't find websocket " + name;
      }
    };

    return WebSocketFacade;

  })();

  app.set('$websocket', new WebsocketFacade);

}).call(this);
