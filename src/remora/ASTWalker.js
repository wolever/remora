goog.provide("remora.ASTWalker");

remora.ASTWalker = function() {
  var self = {};

  self.walk = function(node) {
    var walker = self["walk_" + node.type];
    if (walker === undefined)
      throw Error("ASTWalker: unknown node type: " + node.type);

    if (walker)
      walker(node);
  };

  // Nodes which have no children don't need to be walked.
  self.walk_string = null;
  self.walk_expression = null;
  self.walk_codeblock = null;

  self.walk_doc = function(node) {
    for (var i = 0; i < node.children.length; i += 1)
      self.walk(node.children[i]);
  };

  self.walk_controlblock = function(node) {
    self.walk(node.body);

    var sub_blocks = node.sub_blocks || [];
    for (var i = 0; i < sub_blocks.length; i += 1)
      self.walk(sub_blocks[i]);
  };

  return self;
};
