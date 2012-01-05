goog.require("remora.ASTWalker");

goog.provide("remora.ASTTransforms");

remora.ASTTransforms = function(template) {
  var self = remora.ASTWalker();
  self.template = template;

  self.walk_expression = function(node) {
    if (node.filters.indexOf("n") < 0)
      node.filters.push.apply(node.filters, template.defaultFilters);
  };

  return self;
};
