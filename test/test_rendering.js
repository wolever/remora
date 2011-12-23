require(["test/common", "remora/remora", "underscore"],
function(common, remora, _) {
  common.runTests([
    ["simple rendering", [
      "Hello, ${what}!", { what: "world" }, "Hello, world!"
    ]]
  ], function (input, context, expected) {
    var actual = remora.render(input, context);
    equal(actual, expected);
  });
});
