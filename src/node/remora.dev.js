/* A small wrapper which loads the Google Closure base library and sets it up
 * to dynamically load Remora.
 * Only used during development (ex, to running tests).
 * Exports the ``remora`` namespace, with the addition of a ``__goog``
 * property, which is the ``goog`` top-level namespace.
 */

var vm = require("vm");
var fs = require("fs");

var _oldGlobalsKeys = {};
for (var key in GLOBAL)
  _oldGlobalsKeys[key] = true;

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

for (var key in GLOBAL)
  if (!_oldGlobalsKeys[key])
    delete GLOBAL[key];
