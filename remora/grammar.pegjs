{
  function computeLocation(pos) {
    /*
     * The first idea was to use |String.split| to break the input up to the
     * error position along newlines and derive the line and column from
     * there. However IE's |split| implementation is so broken that it was
     * enough to prevent it.
     */

    if (pos < 0)
      return { line: -1, column: -1, pos: pos };
    
    var line = 1;
    var column = 1;
    var seenCR = false;
    
    for (var i = 0; i < pos; i++) {
      var ch = input.charAt(i);
      if (ch === '\n') {
        if (!seenCR) { line++; }
        column = 1;
        seenCR = false;
      } else if (ch === '\r' | ch === '\u2028' || ch === '\u2029') {
        line++;
        column = 1;
        seenCR = true;
      } else {
        column++;
        seenCR = false;
      }
    }
    
    return { line: line, column: column, pos: pos };
  }

  function Node(type, options) {
    options = options || {};
    options.type = type;
    options.pos = options.pos || pos;
    return options;
  }

  function ParseError(message) {
    this.location = computeLocation(pos);
    this.msg = message;
    this.message = this.toString();
  }

  ParseError.prototype.toString = function() {
    var loc = this.location;
    return "ParseError at " + loc.line + ":" + pos.column + ": " + this.msg;
  };

  function assertCurrentBlockIfElif(keyword) {
    var prev_keyword = (cur_block || {}).keyword
    if (prev_keyword == "if") {
      var sub_blocks = cur_block.sub_blocks || [];
      if (sub_blocks.length == 0)
        return;
      prev_keyword = sub_blocks[sub_blocks.length - 1].keyword;
      if (prev_keyword == "elif")
        return;
    }
    throw new ParseError("'" + keyword + "' must come after an 'if' or " +
                         "'elif', not '" + prev_keyword + "'.");
  }

  function DocNode() {
    return Node("doc", {
      children: []
    });
  };

  function fixup_doc(d) {
    if (d.added_nl) {
      delete d.added_nl;
      var last_child = d.children[d.children.length - 1];
      if (typeof last_child === "string")
        d.children[d.children.length - 1] = last_child.slice(0, -1);
    }

    if (d.children.length < 2)
      return;

    var folded_children = [];
    var last = d.children[0];
    for (var i = 1; i < d.children.length; i += 1) {
      var cur = d.children[i];
      if (typeof last === "string" && typeof cur === "string") {
        last += cur;
        continue;
      }
      if (!(typeof last === "string" && last.length == 0))
        folded_children.push(last);
      last = cur;
    }
    if (!(typeof last === "string" && last.length == 0))
      folded_children.push(last);
    d.children = folded_children;
  }

  var doc_stack = [];
  var cur_doc = DocNode();

  var block_stack = [];
  var cur_block = null;

  if (input.length > 0 && input[input.length - 1] != "\n") {
    cur_doc.added_nl = true;
    input += "\n";
  }
}

root_doc
= doc:doc {
  doc.computeLocation = computeLocation;
  return doc;
}

doc
= _doc* {
  fixup_doc(cur_doc);
  return cur_doc;
}

_doc
= v:(markup / nl / .) {
  if (v !== undefined)
    cur_doc.children.push(v);
  return cur_doc;
}

markup
= expression
/ block_part

expression
= "${" body:exprbody  "}" {
  return Node("expression", {
    expr: body.expr,
    filters: body.filter
  });
}

exprbody
= expr:[^}|]+ f:filter {
  return {
    expr: expr.join(""),
    filter: f
  };
}

filter
= "|" filter:([^}]*) {
  return filter.join("").split(",");
}
/ "" { return []; }


block_part
= line_start line:(_*) "%%" {
  return line.join("") + "%";
}
/ line_start _* "%" _? b:_block_part {
  return b;
}

_block_part
= block:(
  _block_start /
  _block_mid /
  _block_end
) {
  return block;
}
/ line:([^\n]*) {
  pos -= line.length;
  throw new ParseError("invalid control line: " + line.join(""));
}

_block_start
= bl_options:_block_start_body ":" nl {
  bl_options.pos = pos - 1;
  block = Node("controlblock", bl_options);
  block.body = DocNode();

  doc_stack.push(cur_doc);
  cur_doc = block.body;

  block_stack.push(cur_block);
  cur_block = block;
}

_block_start_body
= "for" _+ v:var _+ "in" e:_block_expr {
  return {
    expr: e,
    keyword: "for",
    vars: [v]
  };
}
/ kw:( "if" / "while" ) e:_block_expr {
  return {
    expr: e,
    keyword: kw
  };
}

_block_mid
= bl_options:_block_mid_body _* ":" nl {
  bl_options.pos = pos - 1;
  block = Node("controlblock", bl_options);
  block.body = DocNode();

  if (!cur_block.sub_blocks)
    cur_block.sub_blocks = [];
  cur_block.sub_blocks.push(block);

  fixup_doc(cur_doc);
  cur_doc = block.body;
}

_block_mid_body
= "elif" _+ e:_block_expr {
  assertCurrentBlockIfElif("elif");
  return {
    keyword: "elif",
    expr: e
  };
}
/ "else" {
  assertCurrentBlockIfElif("else");
  return {
    keyword: "else"
  };
}

_block_expr
= _* e:([^:]+) {
  return e.join("");
}

_block_end
= "end" keyword:var nl {
  var cur_begin_keyword = (cur_block || {}).keyword;
  if (keyword !== cur_begin_keyword)
    throw Error("Ending block " + keyword + " which hasn't been started " +
                "(current block: " + cur_begin_keyword + ")");
  fixup_doc(cur_doc);
  cur_doc = doc_stack.pop();
  var this_block = cur_block;
  cur_block = block_stack.pop();
  return this_block;
}

var
= v:[a-zA-Z_0-9]+ { return v.join(""); }

_
= text:([ \t]) {
  return text;
}

line_start
= &{
  return input[pos-1] == "\n" || pos == 0;
}

nl
= text:(_* "\n") {
  return text.join("");
}
