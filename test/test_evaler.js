var evaler = remora.evaler;

QUnit.module("evaler");

test("simple eval", function() {
  equal(evaler.evalSync("1 + 2"), 3);
});

function getLineNumberInErrorTest(code) {
  var newlines = "1,\n\n\n\n\n\n\n\n\n\n"; /* 10 '\n's */
  newlines += newlines + newlines + newlines;
  newlines += "\n";
  return {
    source: newlines + code + ",\n\n\n2",
    lineNumber: 42
  };
}

function runLineNumberInErrorTest(suffix) {
  var test = getLineNumberInErrorTest(suffix);

  try {
    evaler.evalSync(test.source + (suffix || ""));
  } catch (e) {
    evaler.fixExceptionLineNumbers(e);
    equal(e.lineNumber, test.lineNumber);
    return;
  }
  throw Error("expected error not raised!");
}

if (evaler.fixExceptionLineNumbers.supported) {
  test("correct runtimme error line numbers", function() {
    runLineNumberInErrorTest("(function() { throw Error('ohno'); })()");
  });

  test("correct syntax error line numbers", function() {
    runLineNumberInErrorTest("blah blah");
  });
}
