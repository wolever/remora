{
  function computeLocation(pos) {
    // Note: this differs slightly from PegJS's 'compute location' function
    // as it considers newlines to be part of the line, not part of the next
    // line (ex, if the input is "a\nb", then `computeLocation(1)` (ie, the
    // '\n') will return `line: 1`, not `line: 2`).

    if (pos < 0)
      return { line: -1, column: -1, pos: pos };
    if (pos > input.length)
      pos = input.length;

    var line = 1;
    var column = 1;
    var seenNL = false;

    for (var i = 0; i < pos; i += 1) {
      if (seenNL) {
        line += 1;
        column = 0;
        seenNL = false;
      }
      column += 1;

      switch (input.charAt(i)) {
        case '\r':
        case '\u2028':
        case '\u2029':
          if (i + 1 < pos && input.charAt(i + 1) === '\n')
            continue;
        case '\n':
          seenNL = true;
      }
    }

    return { line: line, column: column, pos: pos };
  }

  function Node(type, options) {
    options = options || {};
    options.type = type;
    if (options.pos === undefined)
      throw Error("Node " + type + " doesn't define a 'pos'!");
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
      pos: pos,
      children: []
    });
  };

  function fixup_doc(d) {
    if (d.added_nl) {
      delete d.added_nl;
      var last_child = d.children[d.children.length - 1];
      if ((last_child || {}).type === "string")
        last_child.value = last_child.value.slice(0, -1)
    }
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
  if (typeof v === "string") {
    var last_child = cur_doc.children[cur_doc.children.length - 1] || {};
    if (last_child.type === "string") {
      last_child.value += v;
      v = undefined;
    } else {
      v = Node("string", {
        value: v,
        pos: pos - 1
      });
    }
  }

  if (v !== undefined) {
    cur_doc.children.push(v);
  }

  return cur_doc;
}

markup
= expression
/ control_block
/ code_block

expression
= "${" body:exprbody  "}" {
  return Node("expression", {
    pos: pos - 1,
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


control_block
= line_start line:(_*) "%%" {
  return line.join("") + "%";
}
/ line_start _* "%" _? b:_control_block {
  return b;
}

_control_block
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
  var block = Node("controlblock", bl_options);
  block.body = DocNode();

  doc_stack.push(cur_doc);
  cur_doc = block.body;

  block_stack.push(cur_block);
  cur_block = block;
}

_block_start_body
= "for" _+ v0:var v1:(_* "," _* v:var { return v })? _+ "in" e:_block_expr {
  var vars  = [v0];
  if (v1)
    vars.push(v1);
  return {
    expr: e,
    keyword: "for",
    vars: vars
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
  var block = Node("controlblock", bl_options);
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

code_block
= "<%" body:(!"%>" ch:. { return ch })+ "%>" {
  return Node("codeblock", {
    pos: pos - 2,
    body: body.join("")
  });
}

var
= v:[a-zA-Z_0-9$]+ { return v.join(""); }

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

/* vim: set filetype=javascript shiftwidth=2 tabstop=2 softtabstop=2 :*/
