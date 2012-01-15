// Note: for some inexplicable reason, the Node qunit module requires a "code"
// file to be applied, and requires that that code file export any globals
// required by tests. This file exists to fill that role.

var remora = require("../src/node/remora.dev.js");
GLOBAL.remora = remora;
GLOBAL.goog = remora.__goog;
