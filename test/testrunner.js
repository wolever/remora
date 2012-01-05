#!/usr/bin/env node

throw Error("testrunner.js not working yet (need to figure out Closure -> Node compat)");

var runner = require("qunit");

runner.run({
  code: "remora",
  tests: [
    "./test_core.js",
    "./test_evaler.js",
    "./test_transforms.js",
  ]
});


