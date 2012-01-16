#!/usr/bin/env node

process.chdir(__dirname);

var fs = require("fs");
var exec = require('child_process').exec;

var remora = require("../src/node/remora.dev.js");

var testScripts = [
  "test_core.js",
  "test_evaler.js",
  "test_transforms.js",
];

var testrunners = {
  "testrunner-dev.html": {
    template: "testrunners/testrunner.html",
    setup: [
      '<script src="../src/browser/base.js"></script>',
      '<script>goog.require("remora");</script>',
      '<script src="../src/remora/jquery.js"></script>',
    ].join("\n"),
  },
  "testrunner-devpkg.html": {
    template: "testrunners/testrunner.html",
    setup: [
      '<script src="../build/devpkg.js"></script>',
    ].join("\n"),
  },
  "testrunner-dev.js": {
    template: "testrunners/testrunner.js",
    code: "../src/node/remora.dev.js",
  },
  "testrunner-node_pkg.js": {
    template: "testrunners/testrunner.js",
    code: "../build/node_pkg.js",
  },
};

exec("rm testrunner-*").on("exit", function() {
  for (var runnerFile in testrunners) {
    if (!(testrunners.hasOwnProperty(runnerFile)))
      continue;
    var runnerData = testrunners[runnerFile];
    runnerData.testScripts = testScripts;
    var runnerTemplateStr = fs.readFileSync(runnerData.template, "utf-8");
    fs.writeFileSync(runnerFile, remora.render(runnerTemplateStr, runnerData, {
      defaultFilters: [],
    }));
    var stat = fs.statSync(runnerData.template);
    fs.chmodSync(runnerFile, stat.mode);
    console.log("wrote " + runnerFile);
  }
});
