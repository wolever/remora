define(["remora/astWalker"], function(astWalker) {
  function ASTTransforms(template) {
    var self = astWalker.ASTWalker();
    self.template = template;

    self.walk_expression = function(node) {
      if (node.filters.indexOf("n") < 0)
        node.filters.push.apply(node.filters, template.defaultFilters);
    };

    return self;
  };

  return {
    ASTTransforms: ASTTransforms
  };
});

