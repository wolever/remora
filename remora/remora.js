define(["underscore", "remora/parser", "remora/ast2js", "remora/evaler"],
function(_, parser, ast2js, evaler) {
  function Template(text) {
    var self = {
      converter: ast2js.AST2JS()
    };

    self.setText = function(text) {
      self.text = "" + text;
      self.compile();
    };

    self._setTemplateErrorLocation = function(e) {
      var templatePos = self._js.sourceLineToTemplatePos(e.lineNumber);
      var loc = self._parsed.computeLocation(templatePos);
      e.templateLocation = loc;
    };

    self._fixupRenderException = function(e) {
      var templateFileName = "<remora template>";
      evaler.fixExceptionLineNumbers(e, templateFileName);
      if (e.hasIncorrectLineNumbers)
        return;

      var templatePos;
      var templateLoc;
      for (var i = 0; i < e.parsedStack.length; i += 1) {
        var frame = e.parsedStack[i];
        if (frame.fileName == templateFileName) {
          templatePos = self._js.sourceLineToTemplatePos(frame.lineNumber);
          templateLoc = self._parsed.computeLocation(templatePos);
          frame.lineNumber = templateLoc.line;
        }
      }

      if (templateLoc)
        e.stack = e.parsedStack.toStackString()

      if (e.fileName == templateFileName) {
        templatePos = self._js.sourceLineToTemplatePos(e.lineNumber);
        templateLoc = self._parsed.computeLocation(templatePos);
        e.generatedSourceLineNumber = e.lineNumber;
        e.lineNumber = templateLoc.line;
      }

      if (templateLoc)
        e.templateLocation = templateLoc;

    };

    self.compile = function() {
      self._parsed = parser.parse(self.text);
      self._js = self.converter.convert(self._parsed);
      try {
        self._render = evaler.evalSync(self._js.source);
      } catch (e) {
        /* global */ __bad_script = self._js.source;
        /* global */ __eval_error = e;
        self._fixupRenderException(e);
        // The templateLocation *should* always exist...
        var templateLocation = e.templateLocation || {};
        if (e.hasIncorrectLineNumbers) {
          e.message = (
            "with generated JavaScript (see global __bad_script) line " +
            e.lineNumber + " (note: template line number unavailable; try " +
            "using Firefox): " + e.message
          );
        } else {
          e.message = (
            "with generated JavaScript (see global __bad_script). Error " +
            "caused by template line " + e.lineNumber + ": " + e.message
          );
        }
        throw e;
      }
    };

    self.render = function(data) {
      var context = RenderContext({
        data: data
      });
      try {
        self._render(context);
      } catch (e) {
        /* global */ __render_error = e;
        self._fixupRenderException(e);
        if (e.templateLocation)
          e.message = "template line " + e.templateLocation.line + ": " + e.message;
        throw e;
      }

      return context.buffer.join("");
    };

    self.setText(text);
    return self;
  };

  Template.smartLoad = function(obj) {
    if (typeof obj === "string")
      return Template(obj);

    if (obj === null || obj === undefined)
      return Template("" + obj);

    // When passed a jQuery selector, use the first item.
    if (obj.jquery)
      obj = obj[0];

    // This is how jQuery detects DOM nodes, and it seems reasonable... So I'm
    // going to copy it.
    if (obj.nodeType)
      return Template(obj.innerHTML);

    return Template("" + obj);
  };
      
  function RenderContext(options) {
    var self = _.extend({
      buffer: [],
      data: {}
    }, options);

    self.filter = function(filter_name, text) {
      var func = RenderContext.defaultFilters[filter_name];
      if (!func)
        throw Error("no such filter: " + filter_name);
      return func(text);
    };

    self.write = function(text) {
      self.buffer.push(text);
    };

    return self;
  };

  RenderContext.defaultFilters = {
    u: function(text) {
      return escape(text);
    },
    h: function(text) {
      return _.escape(text);
    },
    trim: function(text) {
      return text.replace(/^[ \t\n\v]*/, "").replace(/[ \n\t\v]*$/, "");
    }
  };

  return {
    Template: Template,
    RenderContext: RenderContext,
    render: function(text, data) {
      return Template.smartLoad(text).render(data);
    }
  };
});
