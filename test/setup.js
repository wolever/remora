goog.global.logMessages = [];

remora.log._setLogFunc(function(level, var_args) {
  goog.global.logMessages.push({
    level: level,
    args: Array.prototype.slice.call(arguments, 1),
  });
});

var old_testStart = QUnit.testStart;
QUnit.testStart = function() {
  goog.global.logMessages = [];
  return old_testStart.apply(this, arguments);
};

// testDone: { name, failed, passed, total }
var old_testDone = QUnit.testDone;
QUnit.testDone = function(opts) {
  if (opts.failed > 0) {
    console.error("FAIL:", opts.name);
    if (goog.global.logMessages.length > 0) {
      console.log("--- captured log messages ---");
      for (var i = 0; i < goog.global.logMessages.length; i += 1) {
        var msg = goog.global.logMessages[i];
        console[msg.level].apply(console, msg.args);
      }
      console.log("--- end captured log messages ---");
    }
  }
  return old_testDone.apply(this, arguments);
};
