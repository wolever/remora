define(["remora/astWalker"], function(astWalker) {
  function AST2JS() {
    var self = astWalker.ASTWalker();

    self.stringify = function(val) {
      return JSON.stringify(val);
    };

    self.emit = function(fragment) {
      var offset = 0;
      while ((offset = fragment.indexOf("\n", offset) + 1) > 0)
        self._resultLine += 1;
      self._result.push(fragment);
    };

    self.convert = function(tree) {
      self._resultLine = 1;
      self._positionMappings = [];
      self._result = [];

      self.emit(
        "(function() {\n" +
        "  function __foreach(obj, func) {\n" +
        "    if (!obj) return;\n" +
        "    for (var key in obj)\n" +
        "      if (obj.hasOwnProperty(key))\n" +
        "        func(obj[key], key, obj);\n" +
        "  }\n" +
        "  return (function(__context) {\n" +
        "    with(__context.data) {\n"
      );
      self.walk(tree);
      self.emit(
        "    }\n" +
        "  });\n" +
        "})()"
      );
      var source = self._result.join("");
      var positionMappings = self._positionMappings;
      var result = {
        source: source,
        sourceLineToTemplatePos: function(sourceLine) {
          var pos = -1;
          for (var i = 0; i < positionMappings.length; i += 1) {
            var mapping = positionMappings[i];
            if (sourceLine >= mapping[0])
              pos = mapping[1];
          }

          return pos;
        }
      };
      delete self._result;
      delete self._positionMappings;
      delete self._resultLine;
      return result;
    };

    self.notePosition = function(node) {
      self.emit("/* " + node.pos + " */");
      self._positionMappings.push([self._resultLine, node.pos]);
    };

    self.walk_string = function(node) {
      self.notePosition(node);
      self.emit("__context.write(" + self.stringify(node.value) + ");\n");
    };

    self.walk_expression = function(node) {
      self.notePosition(node);
      self.emit("__context.write(");
      var filter_closeparens = "";
      for (var i = node.filters.length - 1; i >= 0; i -= 1) {
        var filter = node.filters[i];
        self.emit("__context.filter(" + self.stringify(filter) + ", ");
        filter_closeparens += ")";
      }
      self.emit("(" + node.expr + ")");
      self.emit(filter_closeparens + ");\n");
    };

    self.walk_controlblock = function(node) {
      var end_block = "}\n";
      if (node.keyword == "for") {
        var args = node.vars.join(", ");
        self.emit("__foreach(" + node.expr + ", function(" + args + ") {\n");
        end_block = "});\n";
      } else if (node.keyword == "if" || node.keyword == "while") {
        self.emit(node.keyword + " (" + node.expr + ") {\n");
      } else if (node.keyword == "elif") {
        self.emit("else if (" + node.expr + ") {\n");
      } else if (node.keyword == "else") {
        self.emit("else {\n");
      } else {
        throw Error("unknown control block keyword: " + node.keyword);
      }

      self.walk(node.body);
      self.emit(end_block);

      var sub_blocks = node.sub_blocks || [];
      for (var i = 0; i < sub_blocks.length; i += 1) {
        var sub_block = sub_blocks[i];
        self.walk(sub_block);
      }
    };

    return self;
  };

  return {
    AST2JS: AST2JS
  };
});
