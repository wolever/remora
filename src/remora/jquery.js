(function($) {
if ($ === undefined)
  return;

var remora = goog.global.remora;

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
    var prepared = elem.data("remora:prepared-element");
    if (prepared)
      return prepared;

    var oldElem = elem[0];
    var $oldElem = elem;
    var newElem = document.createElement(options.tag);
    var $newElem = $(newElem);
    for (var i = 0; i < oldElem.attributes.length; i += 1) {
      var attr = oldElem.attributes[i];
      if (options.ignoreAttributes[attr.name])
        continue;
      newElem.attributes.setNamedItemNS(attr.cloneNode(false));
    }
    oldElem.parentNode.replaceChild(newElem, oldElem);
    template = methods.template(elem, options, $newElem);
    $oldElem.data("remora:prepared-element", $newElem);
    $newElem.data("remora:prepared-element", $newElem);
    return $newElem;
  },

  render: function(elem, data, options) {
    options.data = options.data || data;
    elem = methods.prepare(elem, options);
    var template = methods.template(elem, options);
    elem[0].innerHTML = template.render(options.data);
    return elem;
  }
};

$.fn.remora = function(methodName, first, second) {
  if (methodName === "setRemora") {
    remora = first;
    return this;
  }

  var method = methods[methodName];
  if (!method)
    throw Error("Unknown method: " + methodName);

  if (!this.length)
    throw Error("Invalid call (empty selector)");

  switch (methodName) {
    case "render":
      second = methods.options(this, second);
      break;
    case "options":
      /* do nothing */
      break;
    default:
      first = methods.options(this, first);
  }

  return method.apply(null, [this, first, second]);
};

})(goog.global.jQuery);
