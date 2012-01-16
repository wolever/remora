goog.require("remora.utils");
goog.require("remora.parser");
goog.require("remora.AST2JS");
goog.require("remora.ASTTransforms");
goog.require("remora.evaler");

goog.provide("remora");

remora.version = goog.global.REMORA_VERSION || "dev";

remora.RenderContext = function(options) {
  var self = remora.utils.extend({
    buffer: [],
    data: {}
  }, options);

  self.filter = function(filterName, text) {
    if (text === undefined)
      return undefined;

    if (filterName === "n")
      return text;

    var func = remora.RenderContext.builtinFilters[filterName];
    if (!func)
      throw Error("no such filter: " + filterName);

    // All built-in filters assume that the input is a string, so make sure
    // that's true here. This shouldn't be done for user filters, though, as
    // they might expect some other type of input.
    if (typeof text !== "string")
      text = "" + text;

    return func(text);
  };

  self.write = function(text, ignoreUndefined) {
    if (ignoreUndefined && text === undefined)
      return;
    self.buffer.push(text);
  };

  return self;
};

remora.Template = function(text, options) {
  var self = remora.utils.extend({
    converter: remora.AST2JS(),
    defaultFilters: ["h"]
  }, options || {});

  self.transforms = self.transforms || remora.ASTTransforms(self);

  self.setText = function(text) {
    self.text = "" + text;
    self.compile();
  };

  self._fixupRenderException = function(e) {
    var templateFileName = "<remora template>";
    remora.evaler.fixExceptionLineNumbers(e, templateFileName);
    e.templateLocation = {};
    if (e.hasIncorrectLineNumbers)
      return;

    var templatePos;
    var firstTemplateLoc;
    var templateLoc;
    for (var i = 0; i < e.parsedStack.length; i += 1) {
      var frame = e.parsedStack[i];
      if (frame.fileName == templateFileName) {
        templatePos = self._js.sourceLineToTemplatePos(frame.lineNumber);
        templateLoc = self._parsed.computeLocation(templatePos);
        frame.lineNumber = templateLoc.line;
        if (!firstTemplateLoc)
          firstTemplateLoc = templateLoc;
      }
    }

    if (templateLoc)
      e.stack = e.parsedStack.toStackString()

    if (e.fileName == templateFileName) {
      templatePos = self._js.sourceLineToTemplatePos(e.lineNumber);
      templateLoc = self._parsed.computeLocation(templatePos);
      e.generatedSourceLineNumber = e.lineNumber;
      e.lineNumber = templateLoc.line;
      if (!firstTemplateLoc)
        firstTemplateLoc = templateLoc;
    }

    if (templateLoc)
      e.templateLocation = firstTemplateLoc;

  };

  self.compile = function() {
    self._parsed = remora.parser.parse(self.text);
    self.transforms.walk(self._parsed);
    self._js = self.converter.convert(self._parsed);
    try {
      self._render = remora.evaler.evalSync(self._js.source);
    } catch (e) {
      goog.global.__bad_script = self._js.source;
      goog.global.__eval_error = e;
      self._fixupRenderException(e);
      if (e.hasIncorrectLineNumbers) {
        e.message = (
          "with generated JavaScript (see global __bad_script) line " +
          e.lineNumber + " (note: template line number unavailable; try " +
          "using Firefox): " + e.message
        );
      } else {
        e.message = (
          "with generated JavaScript (see global __bad_script). Error " +
          "caused by template line " + e.templateLocation.line + ": " +
          e.message
        );
      }
      throw e;
    }
  };

  self.render = function(data) {
    var context = remora.RenderContext({
      data: data
    });
    try {
      self._render(context);
    } catch (e) {
      goog.global.__render_error = e;
      self._fixupRenderException(e);
      if (e.templateLocation.line) {
        e.message = (
          "template line " + e.templateLocation.line + ": " + e.message
        );
      } else {
        e.message = "in remora template: " + e.message;
      }
      e.message += " (see global __render_error)";
      throw e;
    }

    return context.buffer.join("");
  };

  self.setText(text);
  return self;
};

remora.Template.smartLoad = function(obj, options) {
  if (typeof obj === "string")
    return remora.Template(obj, options);

  if (obj === null || obj === undefined)
    obj = "" + obj;

  // This is how jQuery detects DOM nodes, and it seems reasonable... So I'm
  // going to copy it.
  if (obj.nodeType)
    obj = obj.innerHTML;

  return remora.Template("" + obj, options);
};

(function() {
  var xmlEscapes = {
    "&" : "&amp;",
    ">" : "&gt;", 
    "<" : "&lt;", 
    '"' : "&#34;",
    "'" : "&#39;"
  };
  var xmlEscapeRe = /[&<>'"]/g;

  remora.RenderContext.builtinFilters = {
    u: function(text) {
      return escape(text);
    },
    h: function(text) {
      return text.replace(xmlEscapeRe, function(chr) {
        return xmlEscapes[chr];
      });
    },
    trim: function(text) {
      return text.replace(/^[ \t\n\v]*/, "").replace(/[ \n\t\v]*$/, "");
    }
  };
})();

remora.render = function(text, data, options) {
  return remora.Template.smartLoad(text, options).render(data);
};
