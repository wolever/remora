define({
  runTests: function(tests, func) {
    _.each(tests, function(name_args) {
      var name = name_args[0];
      var args = name_args[1];
      test(name, function() {
        func.apply(null, args);
      });
    });
  }
});
