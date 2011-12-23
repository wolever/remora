define(["underscore", "remora/parser", "remora/tree2js"],
function(underscore, parser, tree2js) {
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
      var result = [];
      var context = {
        write: _.bind(result.push, result),
        data: data
      };
      self._render(context);
      return result.join("");
    };

    self.setText(text);
    return self;
  };

  return {
    Template: Template,
    render: function(text, data) {
      return Template(text).render(data);
    }
  };
});
