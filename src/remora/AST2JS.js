goog.require("remora.ASTWalker");

goog.provide("remora.AST2JS");

remora.AST2JS = function() {
  var self = remora.ASTWalker();

  var quoteable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var quoted = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\'
  };

  // Taken from json2.js
  self.quote = function(string) {
    quoteable.lastIndex = 0;
    return quoteable.test(string) ? '"' + string.replace(quoteable, function (a){
      var c = quoted[a];
      return typeof c === 'string'
        ? c
        : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  }

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
      "  return (function(__context) {\n" +
      "    with(__context.data || {}) {\n"
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
          if (sourceLine < mapping[0])
            break;
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

  self.notePosition = function(templatePos, jsAtNode) {
    if (jsAtNode && jsAtNode.indexOf("\n") >= 0) {
      var basePos = templatePos - jsAtNode.length;
      var posOffset = -1;
      var lineOffset = -1;
      while ((posOffset = jsAtNode.indexOf("\n", posOffset + 1)) >= 0) {
        lineOffset += 1;
        self._positionMappings.push([
          self._resultLine + lineOffset,
          basePos + posOffset
        ]);
      }
    } else {
      self._positionMappings.push([self._resultLine, templatePos]);
    }
  };

  self.walk_string = function(node) {
    self.notePosition(node.pos);
    self.emit("__context.write(" + self.quote(node.value) + ");\n");
  };

  self.walk_expression = function(node) {
    self.notePosition(node.pos, node.expr);
    self.emit("__context.write(");
    var filter_closeparens = "";
    for (var i = node.filters.length - 1; i >= 0; i -= 1) {
      var filter = node.filters[i];
      self.emit("__context.filter(" + self.quote(filter) + ", ");
      filter_closeparens += ")";
    }
    self.emit("(" + node.expr + ")");
    self.emit(filter_closeparens + ");\n");
  };

  self._curUniqueVar = 0;
  self._mkUniqueVar = function(suffix) {
    suffix = suffix || "remoraUniqueVar";
    return "__remora" + suffix + self._curUniqueVar++;
  }

  self.walk_controlblock = function(node) {
    self.notePosition(node.pos);
    var end_block = "}\n";
    if (node.keyword == "for") {
      var iterable = self._mkUniqueVar("loopIterable");
      var loopIndex;
      var loopItem;
      if (node.vars.length == 1) {
        loopIndex = self._mkUniqueVar("loopIndex");
        loopItem = node.vars[0];
      } else {
        loopIndex = node.vars[0];
        loopItem = node.vars[1];
      }
      self.emit("var " + iterable + " = (" + node.expr + ");\n");
      self.emit("for (var " + loopIndex + " in " + iterable + ") {\n");
      self.emit("  if (" + iterable + ".hasOwnProperty(" + loopIndex + ")) {\n");
      self.emit("    var " + loopItem + " = " + iterable + "[" + loopIndex + "];\n");
      end_block = "  }\n}\n";
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

  self.walk_codeblock = function(node) {
    var code = node.body + "\n";
    self.notePosition(node.pos, code);
    self.emit(code);
  };

  return self;
};
