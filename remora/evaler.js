(function() {
  var offset = 0;

  function evalHelper(js) {
    try {
      return eval(js);
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
    evalHelper("throw Error()");
  } catch (e) {
    offset = e.lineNumber - 1;
  }

  define({ eval: evalHelper });
})();
