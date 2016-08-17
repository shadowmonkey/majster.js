(function() {
  var UnderscoreUI;

  UnderscoreUI = (function() {
    function UnderscoreUI(jst) {
      this.jst = jst;
      if (this.jst == null) {
        throw "Can't find JST object";
      }
    }

    UnderscoreUI.prototype.compile = function(name, data) {
      if (this.jst[name] == null) {
        throw "Can't find template: " + name;
      }
      return this.jst[name](data);
    };

    return UnderscoreUI;

  })();

  app.set('$view', new UnderscoreUI(window.JST));

}).call(this);
