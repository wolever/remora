require(["remora/evaler", "underscore"],
function(evaler, _) {
  module("evaler");

  test("simple eval", function() {
    equal(evaler.evalSync("1 + 2"), 3);
  });

  function getLineNumberInErrorTest(code) {
    var newlines = "\n\n\n\n\n\n\n\n\n\n"; /* 10 '\n's */
    newlines += newlines + newlines + newlines;
    newlines += "\n";
    return {
      source: newlines + code,
      lineNumber: 42
    };
  }

  function runLineNumberInErrorTest(suffix) {
    if (!evaler.evalSync.supportsErrorLineNumbers)
      return;

    var test = getLineNumberInErrorTest(suffix);

    try {
      evaler.evalSync(test.source + (suffix || ""));
    } catch (e) {
      equal(e.lineNumber, test.lineNumber);
      return;
    }
    throw Error("expected error not raised!");
  }

  test("correct runtimme error line numbers", function() {
    runLineNumberInErrorTest("(function() { throw Error('ohno'); })()");
  });

  test("correct syntax error line numbers", function() {
    runLineNumberInErrorTest("blah blah");
  });

});
