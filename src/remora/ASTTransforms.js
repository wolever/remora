goog.require("remora.ASTWalker");
goog.require("remora.log");

goog.provide("remora.ASTTransforms");

remora.ASTTransforms = function(template) {
  var self = remora.ASTWalker();
  self.template = template;

  self.walk_codeblock = function(node) {
    if (goog.DEBUG) {
      var match = (/\bfunction\s+([a-zA-Z0-9_$]+)\s*\(+/).exec(node.body);
      if (match) {
        var func = match[1];
        remora.log.warn(
          "function declarations ('function " + func + "(...) { ... }') " +
          "inside templates do not work correctly in all browses (see " +
          "http://stackoverflow.com/q/8402682/71522).\n\n" +
          "Use function expressions instead (they work correctly): " +
          "'var " + func + " = function(...) { ... };'"
        );
      }
    }
  };

  self.walk_expression = function(node) {
    if (node.filters.indexOf("n") < 0)
      node.filters.push.apply(node.filters, template.defaultFilters);
  };

  return self;
};
