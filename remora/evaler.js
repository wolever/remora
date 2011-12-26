(function() {
  var offset = 0;

  // Note: because not all environments support line numbers in errors, it
  // might be useful to add an 'evalAsync' function at some point in the future
  // which will evaluate the code by appending a "<script>" element to the
  // document. This was attempted (search commit log for 'evaler.evalAsync'),
  // but the details turn out to be kind of annoying, so it wasn't finished.

  function evalSync(js) {
    try {
      // The parens are added around the JS to ensure that it is a simple
      // expression and not an arbitrary block of code. This will make the
      // (potential) future implementaiton of an 'evalAsync' less painful.
      return eval("(" + js + ")");
    } catch (e) {
      e.message = "with eval'd code (see err.source): " + e;
      if (e.lineNumber) {
        // Currently Chrome doesn't include a '.lineNumber' attribute on
        // exceptions and I can't be bothered to get it right now.
        e.lineNumber = e.lineNumber - offset;
      } else {
        e.lineNumber = -1;
      }
      e.source = js;
      throw e;
    }
  };

  // Testing suggests that the line numbers returned from errors in eval'd code
  // have a random offset (based, at least in part, on the number of blank
  // lines in the source file before the call to 'eval')... So figure out what
  // that offset is here so that the line numbers in the errors we return will
  // be relative to the eval'd source.
  try {
    evalSync("(function() { throw Error(); })()");
  } catch (e) {
    offset = e.lineNumber - 1;
  }

  evalSync.supportsErrorLineNumbers = (offset >= 0);

  define({ evalSync: evalSync });
})();
