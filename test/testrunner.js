#!/usr/bin/env node

var runner = require("qunit");

runner.run({
  code: "../src/node/remora.dev.js",
  tests: [
    "./test_core.js",
    "./test_evaler.js",
    "./test_transforms.js",
  ]
});
