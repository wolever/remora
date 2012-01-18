goog.global.logMessages = [];

remora.log._setLogFunc(function(level, var_args) {
  goog.global.logMessages.push({
    level: level,
    arguments: Array.prototype.concat.apply(arguments),
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
  if (opts.failed) {
    for (var i = 0; i < goog.global.logMessages.length; i += 1) {
      var msg = goog.global.logMessages[i];
      console[msg.level].apply(console, msg.arguments);
    }
  }
  return old_testDone.apply(this, arguments);
};
