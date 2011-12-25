require(["remora/evaler", "underscore"],
function(evaler, _) {
  module("evaler");
  test("simple eval", function() {
    equal(evaler.eval("1 + 2"), 3);
  });

  test("correct line numebers", function() {
    var newlines = "\n\n\n\n\n\n\n\n\n\n";
    newlines += newlines + newlines + newlines;
    newlines += "\n\n";

    try {
      evaler.eval(newlines + "throw Error('ohno')");
    } catch (e) {
      // Chrome doesn't include line numbers and I don't feel like faking it
      // yet.
      if (!e.lineNumber)
        return;
      equal(e.lineNumber, newlines.length + 1);
    }
  });
});
