var vm = require("vm");
var fs = require("fs");
module.exports = function(path, namespace) {
  (function() {
    var data = fs.readFileSync(path);
    vm.runInThisContext(data, path);
  }).call(namespace || GLOBAL);
}
