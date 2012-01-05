goog.provide("remora.utils");

remora.utils.extend = function(base) {
  for (var i = 1; i < arguments.length; i += 1) {
    var arg = arguments[i];
    for (var prop in arg) {
      if (arg.hasOwnProperty(prop)) {
        base[prop] = arg[prop];
      }
    }
  }

  return base;
};
