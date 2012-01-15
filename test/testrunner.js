#!/usr/bin/env node

var runner = require("qunit");

runner.run({
  code: "./_nodeQUnitCompat.js",
  tests: [
    "./test_core.js",
    "./test_evaler.js",
    "./test_transforms.js",
  ]
});
