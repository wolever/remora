require(["remora/remora", "remora/parser", "underscore"],
function(remora, parser, _) {

  function _copyAST(actual, expected) {
    if (typeof actual !== "object")
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
        "a ",
        {
          type: "expression",
          expr: "foo + bar",
          filters: []
        },
        " b"
      ],
      expected_renders: [
        { foo: 20, bar: 22, __expected: "a 42 b"}
      ]
    },

    {
      name: "expr multiple",
      input: "a ${x} b ${y} c",
      expected_ast: [
        "a ",
        {
          type: "expression",
          expr: "x",
          filters: []
        },
        " b ",
        {
          type: "expression",
          expr: "y",
          filters: []
        },
        " c"
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
      expected_ast: ["% foo %\nbar %"],
      expected_renders: [
        { __expected: "% foo %\nbar %" }
      ]
    },

    {
      name: "for loop",
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
            "  num: ",
            {
              type: "expression",
              expr: "foo",
              filters: []
            },
            "\n"
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
                children: ["    stuff!\n"]
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
          children: ["  foo\n"]
        },
        sub_blocks: [
          {
            type: "controlblock",
            keyword: "elif",
            expr: "bar",
            body: {
              type: "doc",
              children: ["  bar\n"]
            }
          },
          {
            type: "controlblock",
            keyword: "else",
            body: {
              type: "doc",
              children: ["  neither\n"]
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
    }
  ];

  var runTests = function() {
    _.each(testcases, function(testcase) {
      test(testcase.name, function() {
        func(testcase);
      });
    });
  }

  module("parser");
  _.each(testcases, function(testcase) {
    test(testcase.name, function() {
      var actual = parser.parse(testcase.input);
      equal(actual.type, "doc");
      astEqual(actual.children, testcase.expected_ast);
    });
  });

  module("rendering");
  _.each(testcases, function(testcase) {
    _.each(testcase.expected_renders || [], function(expected_render) {
      var rname = expected_render.__name;
      var name = testcase.name + (rname? " - " + rname : "");
      test(name, function() {
        var template = remora.Template(testcase.input);
        var actual = template.render(expected_render);
        equal(actual, expected_render.__expected);
      });
    });
  });

  test("includes line number on JS syntax errors", function() {
    try {
      remora.render("1\n2\n${invalid expression}");
    } catch (e) {
      equal(e.templateLocation.line, 3);
      return;
    }
    throw Error("expected error not raised!");
  });

  test("includes line number on runtime errors", function() {
    try {
      remora.render("1\n2\n3\n${null.foo}");
    } catch (e) {
      equal(e.templateLocation.line, 4);
      return;
    }
    throw Error("expected error not raised!");
  });

  module("remora.render");

  test("doesn't crash on null", function() {
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
        "<script type='text/remora-template'>",
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

});
