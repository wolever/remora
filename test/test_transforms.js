require(["remora/remora", "remora/parser", "underscore"],
function(remora, parser, _) {

  var testcases = [
    {
      name: "defaultFilters are added to expressions",
      input: "${foo}",
      expected_renders: [
        { foo: "&<>'\"", __expected: "&amp;&lt;&gt;&#x27;&quot;" }
      ]
    },

    {
      name: "defaultFilters are ignored when 'n' filter is applied",
      input: "${foo|n}",
      expected_renders: [
        { foo: "&<>'\"", __expected: "&<>'\"" }
      ]
    },
  ];

  module("transforms");
  _.each(testcases, function(testcase) {
    _.each(testcase.expected_renders || [], function(expected_render) {
      var rname = expected_render.__name;
      var name = testcase.name + (rname? " - " + rname : "");
      test(name, function() {
        var template = remora.Template(testcase.input, {
          defaultFilters: ["h"]
        });
        var actual = template.render(expected_render);
        equal(actual, expected_render.__expected);
      });
    });
  });

});
