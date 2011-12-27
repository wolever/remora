(function() {
  // Note: because not all environments support line numbers in errors, it
  // might be useful to add an 'evalAsync' function at some point in the future
  // which will evaluate the code by appending a "<script>" element to the
  // document. This was attempted (search commit log for 'evaler.evalAsync'),
  // but the details turn out to be kind of annoying, so it wasn't finished.

  if (typeof console !== "undefined") {
    function debug() {
      console.log.apply(console, arguments);
    }
  } else {
    function debug() {};
  }

  var stackLineRE = /^(.*)@((http|file).*):([\d]*)$/
  function parseStackTrace(stack) {
    if (!stack)
      return null;

    var lines = stack.split(/\n/); 
    var result = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      if (!line.length)
        continue;
      var lineParsed = stackLineRE.exec(line);
      if (!lineParsed) {
        // Because Firefox is awesome and includes all the arguments passed to
        // every function, even valid stack traces can contain invalid lines.
        // Ignore those.
        continue;
      }
      result.push({
        func: lineParsed[1],
        fileName: lineParsed[2],
        lineNumber: parseInt(lineParsed[4] || -1)
      });
    }

    if (result.length < lines.length * 0.1) {
      // If fewer than 10% of the lines were valid stack lines, assume that we
      // couldn't parse the stack trace. 10% is entirely arbitrary and "feels
      // like a good number".
      return null;
    }

    result.toStackString = _parsedStackToString;
    return result;
  }

  function _parsedStackToString() {
    var result = [];
    for (var i = 0; i < this.length; i += 1) {
      var frame = this[i];
      result.push([frame.func, "@", frame.fileName, ":", frame.lineNumber].join(""));
    }
    return result.join("\n") + "\n";
  }

  function evalSync(js) {
    try {
      // The parens are added around the JS to ensure that it is a simple
      // expression and not an arbitrary block of code. This will make the
      // (potential) future implementaiton of an 'evalAsync' less painful.
      return eval("(" + js + ")");
    } catch (e) {
      e.source = js;
      e.hasIncorrectLineNumbers = true;
      throw e;
    }
  };

  function fixExceptionLineNumbers(e, evaledCodeFileName) {
    var self = fixExceptionLineNumbers;
    evaledCodeFileName = evaledCodeFileName || "(evalered)";

    if (!self.supported) {
      e.hasIncorrectLineNumbers = true;
      return;
    }

    delete e.hasIncorrectLineNumbers;
    
    var stack = parseStackTrace(e.stack);
    if (!stack) {
      e.hasIncorrectLineNumbers = true;
      return;
    }

    for (var i = 0; i < stack.length; i += 1) {
      var frame = stack[i];
      if (frame.fileName = self.fileName && frame.lineNumber > self.evaledCodeOffset) {
        frame.fileName = evaledCodeFileName;
        frame.lineNumber -= self.evaledCodeOffset;
      }
    }

    if (e.fileName == self.fileName && e.lineNumber > self.evaledCodeOffset) {
      e.originalFileName = e.fileName;
      e.originalLineNumber = e.lineNumber;
      e.fileName = evaledCodeFileName;
      e.lineNumber -= self.evaledCodeOffset;
    }

    e.originalStack = e.stack;
    e.stack = stack.toStackString();
    e.parsedStack = stack;
  };

  // ***********************************************
  // * DO NOT DEFINE ANY FUNCTIONS BELOW THIS LINE *
  // ***********************************************
  // Because stack traces which point to eval'd code claim that that eval'd
  // code is part of the file which eval'd it, we need to make sure that all
  // code we eval has a line offset that's greater than any functions defined
  // in this file so that 'fixExceptionLineNumbers' can distinguish between it
  // and stack frames which point to legitimate code in this file.  The block
  // of code below determines that offset, so it is important not to define any
  // functions below here, otherwise they will be confused with eval'd code in
  // stack traces.

  try {
    throw Error();
  } catch (e) {
    var stack = parseStackTrace(e.stack);
    if (stack) {
      fixExceptionLineNumbers.fileName = stack[0].fileName;
      fixExceptionLineNumbers.supported = stack[0].lineNumber > 0;
    }
    if (e.lineNumber) {
      evalSync.codeOffsetNewlines = new Array(e.lineNumber + 1).join("\n");
    }
  }

  // Now determine the line number offset of code eval'd with 'evalSync'...
  if (fixExceptionLineNumbers.supported) {
    fixExceptionLineNumbers.evaledCodeOffset = 0;
    try {
      evalSync("(function() { throw Error(); })()");
    } catch (e) {
      fixExceptionLineNumbers.evaledCodeOffset = e.lineNumber - 1;
    }
  }

  define({
    parseStackTrace: parseStackTrace,
    evalSync: evalSync,
    fixExceptionLineNumbers: fixExceptionLineNumbers
  });
})();
