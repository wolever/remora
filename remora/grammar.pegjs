doc
= d:_doc {
  if (d.children.length == 0)
    return d;

  var folded_children = [];
  var last = d.children[d.children.length - 1];
  for (var i = d.children.length - 2; i >= 0; i -= 1) {
    var cur = d.children[i];
    if (typeof last === "string" && typeof cur === "string") {
      last += cur;
      continue;
    }
    folded_children.push(last);
    last = cur;
  }
  folded_children.push(last);
  d.children = folded_children;
  return d;
}

_doc
= v:(markup / [^%]) d:_doc {
  d.children.push(v);
  return d;
}
/ "" {
  return {
    type: "doc",
    children: []
  };
}

markup
= expression
/ controlblock

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

controlblock
= begin:_cb_begin body:doc rest:(_cb_continue doc)* end:_cb_end {
  if (end.keyword !== begin.keyword)
    throw Error("End block " + end.keyword + " != starting block " + begin.keyword);

  begin.type = "controlblock";
  begin.body = body;
  begin.rest = rest;
  return begin;
}

_cb_begin
= "%" _? body:_cb_begin_body _ e:[^:]+ ":\n" {
  body.expr = e.join("");
  return body;
}

_cb_begin_body
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

_cb_continue
= "% blah blah blah"

_cb_end
= "%" _? "end" kw:var {
  return {
    keyword: kw
  };
}

var
= v:[a-zA-Z_0-9]+ { return v.join(""); }

_
= [ \t] { return ""; }
