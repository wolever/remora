#!/usr/bin/env node

process.chdir(__dirname);

if (process.env.LOAD_TESTS) {
  var remora = require("${code}");
  GLOBAL.remora = remora;
  GLOBAL.goog = remora.__goog;
  require("./setup.js");

} else {
  var runner = require("qunit");
  process.env.LOAD_TESTS = true;
  runner.run({
    code: __filename,
    tests: [
        "./test_core.js",
        "./test_evaler.js",
        "./test_transforms.js",
    ]
  }, function(summary) {
    if (summary.failed > 0)
      process.exit(1);
  });
}
