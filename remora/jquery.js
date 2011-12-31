(function($) {
/*
$(...).remora("render", options):
  remora.Template($(...)[0].innerHTML).render(options.data), caching the
  rendered template.

$(...).remora("inplace", options):
  Replaces $(...)[0] with a <div> containing the contents of $(...)[0] rendered
  with options.data. The content of the <div> will be updated on future calls.
*/

var remora = window.remora;

var methods = {
  options: function(elem, options) {
    return $.extend({
      data: {},
      templateOptions: {},
      tag: "div",
      ignoreAttributes: {
        type: true
      }
    }, options || {});
  },

  template: function(elem, options, _cacheTarget) {
    var template = elem.data("remora:template");
    if (!template) {
      template = remora.Template(elem[0].innerHTML, options.templateOptions);
      (_cacheTarget || elem).data("remora:template", template);
    }
    return template;
  },

  render: function(elem, options) {
    var template = elem.data("remora:template");
    if (!template) {
      var oldElem = elem[0];
      var newElem = document.createElement(options.tag);
      for (var i = 0; i < oldElem.attributes.length; i += 1) {
        var attr = oldElem.attributes[i];
        if (options.ignoreAttributes[attr.name])
          continue;
        newElem.attributes.setNamedItemNS(attr.cloneNode(false));
      }
      oldElem.parentNode.replaceChild(newElem, oldElem);
      template = methods.template(elem, options, $(newElem));
      elem = $(newElem);
    }

    elem[0].innerHTML = template.render(options.data);
    return $(elem);
  }
};

$.fn.remora = function(methodName, options) {
  if (methodName === "setRemora") {
    remora = options;
    return this;
  }

  var method = methods[methodName];
  if (!method)
    throw Error("Unknown method: " + methodName);

  if (!this.length)
    throw Error("Invalid call (invalid 'this': " + this + ")");

  if (methodName !== "options")
    options = methods.options(this, options);
  return method.apply(null, [this, options]);
};

})(jQuery);
