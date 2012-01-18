goog.provide("remora.log");

// Define 'remora.log' to make sure that accidental calls to
// 'remora.log("stuff")' are safe.
remora.log = function() {
  remora.log.log.apply(this, arguments);
};

remora.log._log = (function() {
  var console = goog.global.console;
  if (!console)
    return function() {};
  return function(level, var_args) {
    console[level].apply(console, Array.prototype.slice.call(arguments, 1));
  };
})();

remora.log._setLogFunc = function(logFunc) {
  var levels = ["debug", "log", "warn", "error", "exception"];
  for (var i = 0; i < levels.length; i += 1) {
    var level = levels[i];
    remora.log[level] = goog.bind(logFunc, this, level);
  }
  remora.log.warning = remora.log.warn;
};

remora.log._setLogFunc(remora.log._log);

