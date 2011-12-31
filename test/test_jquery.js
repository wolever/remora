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
        '<script id="template" type="text/remora" data-foo="bar">',
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
    var newElem = $("#template").remora("render", { data: { name: "world" }});
    $.each({
      "id": "template",
      "type": undefined,
      "data-foo": "bar"
    }, function(attr, val) {
      equal(newElem.attr(attr), val, "attr " + attr + " doesn't match");
    });
    equal(newElem[0].tagName.toLowerCase(), "div");
    renderedEqual(newElem.html());
  });

  test("re-rendering a .rendered element", function() {
    $("#template").remora("render", { data: { name: "first render" }});
    $("#template").remora("render", { data: { name: "second render" }});
    $("#template").remora("render", { data: { name: "world" }});
    renderedEqual($("#template").html());
  });

});
