/* A small wrapper which loads the Google Closure base library and sets it up
 * to dynamically load Remora.
 * Only used during development (ex, to running tests).
 * Exports the ``remora`` namespace, with the addition of a ``__goog``
 * property, which is the ``goog`` top-level namespace.
 * Note: this script also injects ``remora`` and ``goog`` into the global
 * namespace. This is necessary to make them work during development.
 */

var vm = require("vm");
var fs = require("fs");

var execfile = function(path) {
  var data = fs.readFileSync(path);
  vm.runInThisContext(data, path);
};

execfile("../src/browser/base.js");
execfile("../src/browser/deps.js");
goog.global.CLOSURE_IMPORT_SCRIPT = function(path) {
  execfile("../src/browser/" + path);
  return true;
};
execfile("../src/remora.js");

remora.__goog = goog;
module.exports = remora;
