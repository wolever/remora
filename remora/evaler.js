(function() {
  function evalAsync(js, callback, errback) {
    // Note: the code just after this function will try to guess if 'evalAsync'
    // is supported on the current platform and replace the function if it
    // isn't supported.
    var scriptElem = document.createElement("script");

    var asyncCallbackUniqueifier = 0;
    var asyncCallbackPrefix = "_evaler_evalAsync_callback";
    do {
      var asyncCallbackName = asyncCallbackPrefix + asyncCallbackUniqueifier++;
    } while (window[asyncCallbackName] !== undefined);

    window[asyncCallbackName] = function(success, result) {
      if (scriptElem.parentElement)
        scriptElem.parentElement.removeChild(scriptElem);
      delete window[asyncCallbackName];

      if (success) {
        callback(result);
      } else {
        if (errback)
          errback(result);
        else
          throw result;
      }
    };

    var wrappedJS = [
      "try { " + asyncCallbackName + "(true, (" + js + ")); }",
      "catch (e) { " + asyncCallbackName + "(false, e); }"
    ];
    scriptElem.innerHTML = wrappedJS.join("\n");
    try {
      document.body.appendChild(scriptElem);
    } catch (e) {
      window[asyncCallbackName](false, e);
    }
  };

  if (typeof document == "undefined") {
    evalAsync = function() {
      throw Error("'evaler.evalAsync' depends on 'documnet.createElement' " +
                  "but 'document' is not available. Use 'evaler.evalSync' " +
                  "instead (use 'evaler.evalAsync.supported' to determine " +
                  "at runtime if 'evalSync' is supported).");
    };
    evalSync.supported = false;
  } else {
    evalSync.supported = true;
  }

  var evalSyncErrorLineOffset = 0;
  function evalSync(js) {
    try {
      return eval("(" + js + ")");
    } catch (e) {
      e.message = "with eval'd code (see err.source): " + e;
      if (e.lineNumber) {
        // Currently Chrome doesn't include a '.lineNumber' attribute on
        // exceptions and I can't be bothered to get it right now.
        e.lineNumber = e.lineNumber - evalSyncErrorLineOffset;
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
    evalSync("throw Error()");
  } catch (e) {
    evalSyncErrorLineOffset = e.lineNumber;
  }
  evalSync.supportsErrorLineNumbers = evalSyncErrorLineOffset >= 0;

  define({
    evalAsync: evalAsync,
    evalSync: evalSync
  });
})();
