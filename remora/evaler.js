(function() {
  var offset = 0;

  function evalHelper(js) {
    try {
      return eval(js);
    } catch (e) {
      var err = new Error("with eval'd code (see err.source): " + e);
      if (e.lineNumber) {
        // Currently Chrome doesn't include a '.lineNumber' attribute on
        // exceptions and I can't be bothered to get it right now.
        err.lineNumber = e.lineNumber - offset;
      }
      err.source = js;
      throw err;
    }
  };

  try {
    evalHelper("throw Error()");
  } catch (e) {
    offset = e.lineNumber - 1;
  }

  define({ eval: evalHelper });
})();
