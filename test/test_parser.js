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
      }],
    ]]

  ], function(input, expected) {
    var actual = parser.parse(input);
    equal(actual.type, "doc");
    deepEqual(actual.children, expected);
  });

});
