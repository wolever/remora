``remora``: less insane JavaScript templating
=============================================

``remora`` is a JavaScript-based templating engine, fashioned after Mako, which
strives to be slightly less broken than the current breed of JavaScript
templating engines.


Status
------

Very, very alpha. No, seriously, it would be a horrible idea to even think
about using ``remora`` right now.


Less broken?
------------

In my opinion, most current JavaScript templating engines are insufficient for
my purposes for one (or more) reasons:

    * Debugging is difficult (template line numbers are not included in error
      messages, for example).
    * They are too simple (looping is difficult and automatic filtering is not
      supported, for example).
    * They rely on HTML attributes or other similarly complex schemes.

I hope that ``remora`` will address these issues by:

    * Ensuring that debuggability is a fundamental design goal, considered from
      the eighteenth commit.
    * Copying the design and syntax of a proven language, Mako.


Usage
=====

Syntax
------

* Expression substitution: ``Hello, ${what}!``
* Escaping/filtering expressions: ``Message: ${message_html|n}`` (``u`` for
  URL escaping, ``h`` for HTML escaping (enabled by default), ``n`` to disable
  default escaping, ``trim`` to trim whitespace).
* Control structures: ``% for a in [1, 2, 3]:``, ``% if b:``, ``% elif c:``,
  ``% else:``, ``% while d``, all terminated by ``% end<keyword>`` (ex, ``%
  endfor``).

``remora``'s syntax is as close as possible to `Mako's syntax`__, so Mako's
documentation can be used to fill in the details.

.. __: http://www.makotemplates.org/docs/syntax.html#

Loading
-------

XXX WRITE THIS XXX

In the near future, though, you will be able to load ``remora`` from...

* A CommonJS-compatible runtime: ``var remora = require("remora");``
* AMD loader such as ``require.js``: ``require(["remora"], function(remora) {
  ... });``
* A ``<script />`` tag: ``<script src="remora-x.x.x-min.js"></script>``

Templating
----------

The simplest way to template is using the ``remora.render`` method::

    > remora.render("Hello, ${what}!", { what: "world" })
    "Hello, world!"

However, if a template is to be used multiple times, it is more efficient to
create an instance of ``remora.Template``, then call the ``Template.render``
method::

    > t = remora.Template("Hello, ${what}!")
    > t.render({ what: "world" })
    "Hello, world!"
    > t.render({ what: "spam" })
    "Hello, spam!"

``remora`` also includes a `jQuery Plugin`_.

jQuery Plugin
-------------

The jQuery plugin provides two methods for combining DOM nodes and templates:

``$(...).remora("template" [, options])``:
    Returns an instance of ``remora.Template`` using the body of the selected
    element as the template::

        <script id="my-template" type="text/x-remora">Hello, ${what}!</script>

        > $("#my-template").remora("template").render({ what: "world" })
        Hello, world!

    Note: the template is cached, so multiple calls to ``.remora("template")``
    will be efficient.


``$(...).remora("render" [, data [, options]])``:
    Replaces the selected element(s) with a ``div`` (or ``options.tag``), where
    the content of the ``div`` is the result of rendering the old content
    with ``data``::

        <script id="my-template" class="foo" type="text/x-remora">
            Hello, ${what}!
        </script>

        > $("#my-template").render({ what: "world" })
        <div id="my-template" class="foo">
            Hello, world!
        </div>
        > $("#my-template").render({ what: "spam" })
        <div id="my-template" class="foo">
            Hello, spam!
        </div>

    Note that, as shown above, render can be called multiple times on the same
    element (although it will only be replaced on the first call), and the
    template will be cached between calls.


Example
.......

Consider this simple Twitter-like site::

    <div id="status-updates">
        <script id="status-template" type="text/x-remora">
            <div id="status-${status.id}" class="status-update">
                <img src="${status.author_icon_small}" />
                <p>${status.text}</p>
                <p>Posted ${status.posted_time_delta}</p>
            </div>
        </script>
    </div>

    <script id="selected-status" type="text/x-remora">
        % if typeof status === "undefined":
            <p>Click a status update to get more details...</p>
            <% return; /* note: '<% .. %>' isn't implemented yet */ %>
        % endif
        <img src="${status.author_icon_large}" />
        <p>${status.text}</p>
        <p>
            Posted ${status.posted_time_delta} using
            <a href="${status.posting_software_link">${status.posting_software}</a>
        </p>
    </script>

The jQuery plugin could be used like this::

    var statusTemplate = $("#status-template").remora("template");
    $.getJSON("/status-updates", function(statuses) {
        var newStatusesHTML = $.map(statuses, statusTemplate.render);
        $("#status-updates").html(newStatusesHTML.join("\n"));
        $.each(statuses, function(status) {
            $(document.getElementBtId(status.id)).data("status", status);
        });
    });

    $("#selected-status").remora("render", null);
    $("#status-updates").on("click", ".status-update", function(event) {
        $("#selected-status").remora("render", $(this).data("status"));
    });


