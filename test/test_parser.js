require(["test/common", "remora/parser", "underscore"],
function(common, parser, _) {

  common.runTests([
    ["expr simple", [
      "a ${foo + bar} b",
      [
        "a ",
        {
          type: "expression",
          expr: "foo + bar",
          filters: []
        },
        " b"
      ]
    ]],

    ["expr multiple", [
      "a ${x} b ${y} c",
      [
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
      ]
    ]],

    ["expr with single filter", [
      "${foo|bar}",
      [{
        type: "expression",
        expr: "foo",
        filters: ["bar"]
      }]
    ]],

    ["expr with multiple filters", [
      "${foo|bar,baz}",
      [{
        type: "expression",
        expr: "foo",
        filters: ["bar", "baz"]
      }]
    ]],

    ["escaping %s", [
      "%% foo %\n"+
      "bar %",
      ["% foo %\nbar %"]
    ]],

    ["for loop", [
      "% for foo in bar:\n" +
      "  stuff!\n" +
      "% endfor",
      [{
        type: "controlblock",
        keyword: "for",
        vars: ["foo"],
        expr: "bar",
        body: {
          type: "doc",
          children: ["  stuff!\n"]
        }
      }]
    ]],

    ["nested for if loop", [
      "% if foo:\n" +
      "  % for bar in baz:\n" +
      "    stuff!\n" +
      "  % endfor\n" +
      "% endif",
      [{
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
    ]]

  ], function(input, expected) {
    var actual = parser.parse(input);
    equal(actual.type, "doc");
    deepEqual(actual.children, expected);
  });

});
