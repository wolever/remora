var parser = remora.parser;

function str(x) {
  return { type: "string", value: x };
}

function _copyAST(actual, expected) {
  if (typeof actual !== "object")
    return actual;

  if (typeof expected !== "object")
    return actual;

  var copy = new expected.constructor();

  for (var key in expected) {
    if (expected.hasOwnProperty(key)) { 
      var actualVal = actual[key];
      if (actualVal !== undefined)
        copy[key] = _copyAST(actualVal, expected[key]);
    }
  }

  return copy;
}

function astEqual(actual, expected) {
  var actualCopy = _copyAST(actual, expected);
  deepEqual(actualCopy, expected);
}

var testcases = [
  {
    name: "expr simple",
    input: "a ${foo + bar} b",
    expected_ast: [
      str("a "),
      {
        type: "expression",
        expr: "foo + bar",
        filters: []
      },
      str(" b")
    ],
    expected_renders: [
      { foo: 20, bar: 22, __expected: "a 42 b"}
    ]
  },

  {
    name: "expr multiple",
    input: "a ${x} b ${y} c",
    expected_ast: [
      str("a "),
      {
        type: "expression",
        expr: "x",
        filters: []
      },
      str(" b "),
      {
        type: "expression",
        expr: "y",
        filters: []
      },
      str(" c")
    ],
    expected_renders: [
      { x: "1", y: "2", __expected: "a 1 b 2 c" }
    ]
  },

  {
    name: "expr with single filter",
    input: "${' foo '|trim}",
    expected_ast: [{
      type: "expression",
      expr: "' foo '",
      filters: ["trim"]
    }],
    expected_renders: [
      { __expected: "foo" }
    ]
  },

  {
    name: "expr with multiple filters",
    input: "${' < '|trim,h}",
    expected_ast: [{
      type: "expression",
      expr: "' < '",
      filters: ["trim", "h"]
    }],
    expected_renders: [
      { __expected: "&lt;" }
    ]
  },

  {
    name: "escaping %s",
    input: "%% foo %\nbar %",
    expected_ast: [str("% foo %\nbar %")],
    expected_renders: [
      { __expected: "% foo %\nbar %" }
    ]
  },

  {
    name: "for loop with single var",
    input: (
      "% for foo in bar:\n" +
      "  num: ${foo}\n" +
      "% endfor"
    ),
    expected_ast: [{
      type: "controlblock",
      keyword: "for",
      vars: ["foo"],
      expr: "bar",
      body: {
        type: "doc",
        children: [
          str("  num: "),
          {
            type: "expression",
            expr: "foo",
            filters: []
          },
          str("\n")
        ]
      }
    }],
    expected_renders: [
      { __name: "short list",
        bar: [1, 2, 3],
        __expected: "  num: 1\n  num: 2\n  num: 3\n"
      },
      { __name: "empty list",
        bar: [],
        __expected: ""
      }
    ]
  },

  {
    name: "for loop with two vars",
    input: (
      "% for key, val in bar:\n" +
      "  ${key}: ${val}\n" +
      "% endfor"
    ),
    expected_ast: [{
      type: "controlblock",
      keyword: "for",
      vars: ["key", "val"],
      expr: "bar",
      body: {
        type: "doc",
        children: [
          str("  "),
          {
            type: "expression",
            expr: "key",
            filters: []
          },
          str(": "),
          {
            type: "expression",
            expr: "val",
            filters: []
          },
          str("\n")
        ]
      }
    }],
    expected_renders: [
      { __name: "short list",
        bar: ["foo", "bar"],
        __expected: "  0: foo\n  1: bar\n"
      },
      { __name: "object",
        bar: { k0: "v0", k1: "v1" },
        __expected: "  k0: v0\n  k1: v1\n"
      },
      { __name: "empty list",
        bar: [],
        __expected: ""
      }
    ]
  },

  {
    name: "nested for if loop",
    input: (
      "% if foo:\n" +
      "  % for bar in baz:\n" +
      "    stuff!\n" +
      "  % endfor\n" +
      "% endif"
    ),
    expected_ast: [{
      type: "controlblock",
      keyword: "if",
      expr: "foo",
      body: {
        type: "doc",
        children: [
          {
            type: "controlblock",
            keyword: "for",
            vars: ["bar"],
            expr: "baz",
            body: {
              type: "doc",
              children: [str("    stuff!\n")]
            }
          }
        ]
      }
    }],
    expected_renders: [
      { __name: "if-statement is false",
        foo: false,
        __expected: ""
      },
    ]
  },

  {
    name: "if/elif/else",
    input: (
      "% if foo:\n" +
      "  foo\n" +
      "% elif bar:\n" +
      "  bar\n" +
      "% else:\n" +
      "  neither\n" +
      "% endif"
    ),
    expected_ast: [{
      type: "controlblock",
      keyword: "if",
      expr: "foo",
      body: {
        type: "doc",
        children: [str("  foo\n")]
      },
      sub_blocks: [
        {
          type: "controlblock",
          keyword: "elif",
          expr: "bar",
          body: {
            type: "doc",
            children: [str("  bar\n")]
          }
        },
        {
          type: "controlblock",
          keyword: "else",
          body: {
            type: "doc",
            children: [str("  neither\n")]
          }
        }
      ]
    }],
    expected_renders: [
      { __name: "if-clause",
        foo: true, bar: false,
        __expected: "  foo\n"
      },
      { __name: "elif-clause",
        foo: false, bar: true,
        __expected: "  bar\n"
      },
      { __name: "if-clause",
        foo: false, bar: false,
        __expected: "  neither\n"
      },
    ]
  },

  {
    name: "code block with simple expression",
    input: "foo:<% var foo = (bar() % baz); %> ${foo}",
    expected_ast: [
      str("foo:"),
      {
        type: "codeblock",
        body: " var foo = (bar() % baz); "
      },
      str(" "),
      {
        type: "expression",
        expr: "foo",
      }
    ],
    expected_renders: [
      { bar: function() { return 5 },
        baz: 2,
        __expected: "foo: 1"
      }
    ]
  },

  {
    name: "code block calling __context.write",
    input: "<% __context.write('foo') %>",
    expected_ast: [
      {
        type: "codeblock",
        body: " __context.write('foo') "
      },
    ],
    expected_renders: [
      { __expected: "foo" }
    ]
  },

  {
    name: "code block with function that emits content",
    input: [
      "<% var foo = function() { %>",
      "  bar: ${bar}",
      "<% } %>",
      "called: ${foo()}",
    ].join("\n"),
    expected_renders: [
      { bar: 42,
        __expected: "\ncalled: \n  bar: 42\n",
      }
    ]
  },

  {
    name: "code block with function declarations issues warning",
    input: [
      "<% function blah() { %>",
      "<% } %>",
    ].join("\n"),
    expected_renders: [
      { __logMessages: [{ text: /warn:.*function declarations \('function blah/ }] },
    ]
  },

  {
    name: "undefined should be empty string in expressions",
    input: "x${undefined}y",
    expected_renders: [
      { __expected: "xy" }
    ]
  },

  {
    name: "undefined should be empty string in expressions with no filters",
    input: "x${undefined|n}y",
    expected_renders: [
      { __expected: "xy" }
    ]
  },

  {
    name: "undefined should be empty string in expressions with filters",
    input: "x${undefined|h}y",
    expected_renders: [
      { __expected: "xy" }
    ]
  },

];

var runTests = function() {
  testcases.forEach(function(testcase) {
    test(testcase.name, function() {
      func(testcase);
    });
  });
}

QUnit.module("parser");
testcases.forEach(function(testcase) {
  if (!testcase.expected_ast)
    return;
  test(testcase.name, function() {
    var actual = parser.parse(testcase.input);
    equal(actual.type, "doc");
    astEqual(actual.children, testcase.expected_ast);
  });
});

QUnit.module("rendering");
testcases.forEach(function(testcase) {
  (testcase.expected_renders || []).forEach(function(expected_render) {
    var rname = expected_render.__name;
    var name = testcase.name + (rname? " - " + rname : "");
    test(name, function() {
      var template = remora.Template(testcase.input, {
        "defaultFilters": []
      });
      var actual = template.render(expected_render);
      if (expected_render.__expected !== undefined)
        equal(actual, expected_render.__expected);
      (expected_render.__logMessages || []).forEach(function(expected) {
        var found = false;
        goog.global.logMessages.forEach(function(msg) {
          var text = msg.level + ": " + msg.args.join(" ");
          if (text.search(expected.text) >= 0)
            found = true;
        });
        ok(found, expected.text + " was not found in any log messages");
      });
    });
  });
});

var line_numbers_supported = remora.evaler.fixExceptionLineNumbers.supported;
var line_error_testcases = (!line_numbers_supported)? [] : [
  {
    name: "includes line number on JS syntax errors",
    text: "1\n2\n${invalid expression}",
    expected_line_number: 3
  },

  {
    name: "includes line number on runtime errors",
    text: "1\n2\n3\n${null()}",
    expected_line_number: 4
  },

  {
    name: "line numbers are correct for code blocks",
    text: "<%\n2;\nfoo();\n4;\n%>",
    expected_line_number: 3
  }
];

line_error_testcases.forEach(function(testcase) {
  test(testcase.name, function() {
    try {
      remora.render(testcase.text);
    } catch (e) {
      equal(e.templateLocation.line, testcase.expected_line_number);
      return;
    }
    throw Error("expected error not raised!");
  });
});

QUnit.module("remora.render");

test("doesn't crash on null template", function() {
  var rendered = remora.render(null, {});
  equal(rendered, "null");
});

test("works without data argument", function() {
  var rendered = remora.render("42");
  equal(rendered, "42");
});

if (typeof document !== "undefined") {
  function getScriptTemplateElem() {
    var parent = document.createElement("div");
    parent.innerHTML = ([
      "<script type='text/x-remora'>",
      "&amp; ${foo} <div>",
      "</script>"
    ].join(""));
    var scriptElem = parent.children[0];
    equal(scriptElem.tagName.toLowerCase(), "script");
    return scriptElem;
  }

  test("loading from a script element", function() {
    var elem = getScriptTemplateElem();
    var rendered = remora.render(elem, { foo: 42 });
    equal(rendered, "&amp; 42 <div>");
  });
};

QUnit.module("remora.RenderContext.filter");

var filterTestCases = [
  {
    name: "JSON string",
    input: "foo",
    filter: "json",
    expected: '"foo"'
  },

  {
    name: "JSON undefined",
    input: undefined,
    filter: "json",
    expected: undefined
  },

  {
    name: "JSON number",
    input: 42,
    filter: "json",
    expected: "42"
  },

  {
    name: "HTML",
    input: "<>&'\"",
    filter: "h",
    expected: "&lt;&gt;&amp;&#39;&#34;"
  }

];

filterTestCases.forEach(function(testcase) {
  test(testcase.name, function() {
    var c = remora.RenderContext();
    equal(c.filter(testcase.filter, testcase.input), testcase.expected);
  });
});
