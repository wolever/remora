#!/usr/bin/env node

var runner = require("qunit");

runner.run({
  code: "${code}",
  tests: [
    % for testScript in testScripts:
      "./${testScript}",
    % endfor
  ]
});
