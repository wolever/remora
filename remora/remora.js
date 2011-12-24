define(["underscore", "remora/parser", "remora/tree2js"],
function(_, parser, tree2js) {
  function Template(text) {
    var self = {
      converter: tree2js.Tree2JS()
    };

    self.setText = function(text) {
      self.text = text;
      self.compile();
    };

    self.compile = function() {
      self._parsed = parser.parse(self.text);
      self._js = self.converter.convert(self._parsed);
      self._render = eval(self._js);
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
      return Template(text).render(data);
    }
  };
});
