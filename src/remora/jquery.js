(function($) {

var remora = window.remora;

var methods = {
  options: function(elem, options) {
    return $.extend({
      data: undefined,
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

  prepare: function(elem, options) {
    if (elem.data("remora:has-been-prepared"))
      return elem;

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
    $(newElem).data("remora:has-been-prepared", true);
    return $(newElem);
  },

  render: function(elem, options) {
    elem = methods.prepare(elem, options);
    var template = methods.template(elem, options);
    elem[0].innerHTML = template.render(options.data);
    return elem;
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
