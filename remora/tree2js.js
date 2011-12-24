define(["underscore"],
function() {
  function Tree2JS() {
    var self = {};

    self.stringify = function(val) {
      return JSON.stringify(val);
    };

    self.convert = function(tree) {
      var result = [
        "(function(__context) {\n",
        "  var __write = function(val) { __context.write(val); }\n",
        "  with(__context.data) {\n"
      ];
      self.walk(tree, result);
      result.push.apply(result, [
        "  }\n",
        "})"
      ]);
      return result.join("");
    };

    self.walk = function(node, result) {
      var handler = self["walk_" + node.type];
      if (!handler)
        throw Error("unknown node type: " + node.type);

      handler(node, result);
    };

    self.walk_doc = function(node, result) {
      for (var i = 0; i < node.children.length; i += 1) {
        var val = node.children[i];
        if (typeof val === "string") {
          result.push("__write(" + self.stringify(val) + ");\n");
        } else {
          self.walk(val, result);
        }
      }
    };

    self.walk_expression = function(node, result) {
      result.push("__write(");
      var filter_closeparens = "";
      for (var i = 0; i < node.filters.length; i += 1) {
        var filter = node.filters[i];
        result.push("__context.filter(" + self.stringify(filter) + ", ");
        filter_closeparens += ")";
      }
      result.push("(" + node.expr + ")");
      result.push(filter_closeparens + ");\n");
    };
    return self;
  };

  return {
    Tree2JS: Tree2JS
  };
});
