define(["underscore", "remora/parser", "remora/tree2js"],
function(_, parser, tree2js) {
  function Template(text) {
    var self = {
      converter: tree2js.Tree2JS()
    };

    self.setText = function(text) {
      self.text = "" + text;
      self.compile();
    };

    self.compile = function() {
      self._parsed = parser.parse(self.text);
      self._js = self.converter.convert(self._parsed);
      try {
        self._render = eval(self._js);
      } catch (e) {
        var err = Error("on line " + e.lineNumber + " of generated " +
                        "JavaScript (see err.script): " + e);
        err.original = e;
        err.script = self._js;
        throw err;
      }
    };

    self.render = function(data) {
      var context = RenderContext({
        data: data
      });
      self._render(context);
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
      return text.trim();
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
