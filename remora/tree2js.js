define(["underscore"],
function() {
  function Tree2JS() {
    var self = {};

    self.stringify = function(val) {
      return JSON.stringify(val);
    };

    self.convert = function(tree) {
      var result = [
        "(function() {\n" +
        "  function __foreach(obj, func) {\n" +
        "    if (!obj) return;\n" +
        "    for (var key in obj)\n" +
        "      if (obj.hasOwnProperty(key))\n" +
        "        func(obj[key], key, obj);\n" +
        "  }\n" +
        "  return (function(__context) {\n" +
        "    var __write = function(val) { __context.write(val); }\n" +
        "    var __pos = -1;\n" +
        "    try {\n" +
        "      with(__context.data) {\n"
      ];
      self.walk(tree, result);
      result.push.apply(result, [
        "      }\n" +
        "    } catch (e) {\n" +
        "      e.templatePos = __pos;\n" +
        "      throw e;\n" +
        "    }\n" +
        "  });\n" +
        "})();"
      ]);
      return result.join("");
    };

    self.walk = function(node, result) {
      var handler = self["walk_" + node.type];
      if (!handler)
        throw Error("unknown node type: " + node.type);

      if (node.type !== "controlblock")
        self._writePos(node, result);
      handler(node, result);
    };

    self._writePos = function(node, result, suffix) {
      result.push("__pos = " + self.stringify(node.pos) + (suffix || ";\n"));
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

    self.walk_controlblock = function(node, result) {
      var end_block = "}\n";
      if (node.keyword == "for") {
        var args = node.vars.join(", ");
        self._writePos(node, result);
        result.push("__foreach(" + node.expr + ", function(" + args + ") {\n");
        end_block = "});\n";
      } else if (node.keyword == "if" || node.keyword == "while") {
        self._writePos(node, result);
        result.push(node.keyword + " (" + node.expr + ") {\n");
      } else if (node.keyword == "elif") {
        result.push("else if (");
        self._writePos(node, result, ", ");
        result.push(node.expr + ") {\n");
      } else if (node.keyword == "else") {
        result.push(" else {\n");
        self._writePos(node, result);
      } else {
        throw Error("unknown control block keyword: " + node.keyword);
      }

      self.walk(node.body, result);
      result.push(end_block);

      var sub_blocks = node.sub_blocks || [];
      for (var i = 0; i < sub_blocks.length; i += 1) {
        var sub_block = sub_blocks[i];
        self.walk(sub_block, result);
      }
    };

    return self;
  };

  return {
    Tree2JS: Tree2JS
  };
});
