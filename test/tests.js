require(["remora/remora", "remora/parser", "underscore"],
function(remora, parser, _) {

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
      deepEqual(actual.children, testcase.expected_ast);
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

});
