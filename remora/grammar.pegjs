{

  function new_doc() {
    return {
      type: "doc",
      children: []
    };
  }

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
  var cur_doc = new_doc();

  var block_stack = [];
  var cur_block = null;

  var line_start = true;

  if (input.length > 0 && input[input.length - 1] != "\n") {
    cur_doc.added_nl = true;
    input += "\n";
  }
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
  console.log("push:", v);
  return cur_doc;
}

markup
= expression
/ block_part

expression
= "${" body:exprbody  "}" {
  return {
    type: "expression",
    expr: body.expr,
    filters: body.filter
  };
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
= &{ return line_start; } _* "%" _? b:_block_part {
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
/ line:(.*) nl? {
  throw Error("invalid control line: " + line.join(""));
}

_block_start
= block:_block_start_body _ e:([^:]+) ":" nl {
  line_start = true;
  block.type = "controlblock";
  block.expr = e.join("");
  block.body = new_doc();

  doc_stack.push(cur_doc);
  cur_doc = block.body;

  block_stack.push(cur_block);
  cur_block = block;
}

_block_start_body
= "for" _ v:var _ "in" {
  return {
    keyword: "for",
    vars: [v]
  };
}
/ kw:( "if" / "while" ) {
  return {
    keyword: kw
  };
}

_block_mid
= "stuff!!"

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

nl
= text:(_* "\n") {
  line_start = true;
  return text.join("");
}
