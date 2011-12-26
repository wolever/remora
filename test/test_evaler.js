require(["remora/evaler", "underscore"],
function(evaler, _) {
  module("evaler");

  test("simple eval", function() {
    equal(evaler.evalSync("1 + 2"), 3);
  });

  function getLineNumberInErrorTest() {
    var newlines = "\n\n\n\n\n\n\n\n\n\n"; /* 10 '\n's */
    newlines += newlines + newlines + newlines;
    newlines += "\n\n";
    return {
      source: newlines + "(function() { throw Error('ohno'); })()",
      lineNumber: 42
    };
  }

  if (evaler.evalSync.supportsErrorLineNumbers) {
    test("correct error line numbers (sync)", function() {
      var test = getLineNumberInErrorTest();
      try {
        evaler.evalSync(test.source);
      } catch (e) {
        equal(e.lineNumber, test.lineNumber);
        return;
      }
      throw Error("expected error not raised!");
    });
  }

  asyncTest("correct error line numbers (async)", function() {
    var test = getLineNumberInErrorTest();
    evaler.evalAsync(test.source, asyncFail, function(err) {
      start();
      equal(err.lineNumber, test.lineNumber);
    });
  });

});
