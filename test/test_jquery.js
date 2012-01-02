require(["remora/remora", "remora/jquery"],
function(remora) {
  $().remora("setRemora", remora);

  function trim(str) {
    return str.replace(/^[ \n\t]*/, "").replace(/[ \n\t]*$/, "");
  }

  function renderedEqual(actual) {
    equal(trim(actual), "Hello, <em>world</em>!");
  }

  module("jquery", {
    setup: function() {
      $("#qunit-fixture").html([
        '<div>first</div>',
        '<div>first</div>',
        '<script id="template" type="text/x-remora" data-foo="bar">',
          'Hello, <em>${name}</em>!',
        '</script>',
        '<div>last</div>'
      ].join("\n"))
    }
  });

  test("template caching", function() {
    var first = $("#template").remora("template");
    var second = $("#template").remora("template");
    strictEqual(first, second);
  });

  test("rendering a template from .template", function() {
    var template = $("#template").remora("template");
    renderedEqual(template.render({ name: "world" }));
  });

  test("using .render to replace an element", function() {
    var elem = $("#template").remora("render", { name: "world" });
    $.each({
      "id": "template",
      "type": undefined,
      "data-foo": "bar"
    }, function(attr, val) {
      equal(elem.attr(attr), val, "attr " + attr + " doesn't match");
    });
    equal(elem[0].tagName.toLowerCase(), "div");
    renderedEqual(elem.html());
  });

  test("preparing with .prepare", function() {
    var elem = $("#template").remora("prepare");
    equal(elem[0].tagName.toLowerCase(), "div");
    equal(elem.html(), "");
  });

  test("re-rendering a .rendered element", function() {
    $("#template").remora("render", { name: "first render" });
    $("#template").remora("render", { name: "second render" });
    $("#template").remora("render", { name: "world" });
    renderedEqual($("#template").html());
  });

});
