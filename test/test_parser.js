require(["test/common", "remora/parser", "underscore"],
function(common, parser, _) {

  common.runTests(testCases, function(testcase) {
    var actual = parser.parse(testcase.input);
    deepEqual(actual, testcase.expected_ast);
  });

});
