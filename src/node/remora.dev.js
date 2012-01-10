/* A small wrapper which loads the Google Closure base library and sets it up
 * to dynamically load Remora.
 * Only used during development (ex, to running tests).
 */

var _execfile = require("./execfile");

var fake_global = {};
var execfile = function(path) {
  _execfile(path, fake_global);
};

execfile("../src/browser/base.js");
execfile("../src/browser/deps.js");
goog.global.CLOSURE_IMPORT_SCRIPT = function(path) {
  execfile("../src/browser/" + path);
  return true;
};
execfile("../src/remora.js");

module.exports = fake_global;
