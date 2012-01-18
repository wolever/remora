``remora``: less insane JavaScript templating
=============================================

``remora`` is a JavaScript-based templating engine, fashioned after Mako, which
strives to be slightly less broken than the current breed of JavaScript
templating engines.


SHOW ME SHINY THINGS!
---------------------

YOU WANT `THE INTERACTIVE DEMO`__!

It demonstrates simple usage, ``remora``'s nifty parse tree, the
not-entirely-terrible generated JavaScript and even some rendered HTML!

.. __: http://wolever.github.com/remora/example/


Status
------

Sort of alpha! It's being used in a real (but internal) project and is under
active development.


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

``remora``'s syntax is as close as possible to `Mako's syntax`__, which can be
used to clarify any detains that aren't sufficiently clear.

.. __: http://www.makotemplates.org/docs/syntax.html#

Expression Substitution
.......................

The content of ``${...}`` will be evaluated as a JavaScript expression and the
result emitted. For example::

    Hello, ${what}!
    The length of your hypotenuse is ${Math.sqrt(x * x + y * y)}.

Note: if the result of the expression is exactly ``undefined`` it will be
interpreted as an empty string::

    > remora.render("d${undefined}b")
    "db"

Expression Escaping
...................

Expressions can be escaped or filtered by appending ``|<filter>`` to the
expression. For example::

    > remora.render("<em>${name|trim}</em>", { name: "  David  " })
    "<em>David</em>"

The built-in filters are:

* ``u``: URL escaping (``${"foo&bar"|u}`` --> ``"foo%26bar"``)
* ``h``: HTML escaping (enabled by default (see
  ``options.defaultFilters``); ``${"<&>"|h}`` --> ``"&lt;&amp;&gt;"``)
* ``trim``: trims leading and trailing whitespace (``${" x "|trim}`` -->
  ``"x"``)
* ``n``: Disables all default escaping (``${"<hr />"|n}`` --> ``"<hr />"``)

Filters can be chained using ``,``: ``${" foo&bar "|trim,u}`` -->
``"foo%26bar"``.

Currently there is no mechanism for specifying custom filters, but this will
change.

Control Structures
..................

In addition to using "plain" JavaScript for control flow (see `JavaScript
Blocks`_), ``remora`` provides a set of slightly less verbose control
structures:

* ``% for [<key>, ]<value> in object:`` iterates over an object. Note that a
  standard ``for ... in`` loop is used, not a ``.forEach``-esque closure.  For
  example::
    
    % for language in ["JavaScript", "Python"]:
        I like ${language}!
    % endfor

    % for name, age in { "Jim": 12, "Jane": 16 }:
        ${name} is ${age} years old.
    % endfor

* ``% if <expression>:``, ``% elif <expression>:``, ``% else:`` a standard
  ``if`` statement::

    % if age < 18:
        Sorry, you are too young to see this page.
    % elif age > 65:
        Do your parents know what you are looking at?
    % else:
        Welcome to Bowser's Den of Bouncy Castles!
    % endif

* ``% while <expression>:`` a standard while loop::
    
    % while num > 0:
        ${num} bottles of beer on the wall, ${num} bottles of beer!
        Take one down, pass it around, ${--num} bottles of beer on the wall.
    % endwhile

If a literal ``%`` is required at the beginning of a line, ``%%`` can be used::

    > remora.render("%% foo")
    "% foo"

JavaScript Blocks
.................

Raw JavaScript can be inserted using ``<% ... %>`` blocks. Much like other
templating languages such as PHP, these can contain functions and control
structures::

    <% function link(title, href) { %>
        <a href="${href|u}">${title}</a>
    <% } %>

    <% if (showLinks) { %>
        % for title, href in links:
            ${link(title, href)}
        % endfor
    <% } %>

Unsupported Syntax
..................

Currently only the above syntax is supported. This will change over time,
though, as ``remora`` aims to be feature- and syntax-equivalent with Mako.

Any patches which further this goal will be gladly accepted.


Loading
-------

In the near future, though, you will be able to load ``remora`` from...

* A CommonJS-compatible runtime: ``var remora = require("remora");``
* AMD loader such as ``require.js``: ``require(["remora"], function(remora) {
  ... });``
* Google Closure: ``goog.require("remora")``
* A ``<script />`` tag: ``<script src="remora-x.x.x-min.js"></script>``

Currently the three best ways to get using ``remora``:

* Use `http://wolever.github.com/remora/build/devpkg.js`__ from the browser. This
  is a standalone package with no dependencies (although the jQuery plugin will
  only be activated if it is loaded *after* jQuery)::
    
    <script src="http://wolever.github.com/remora/build/devpkg.js"></script>

* Use `http://wolever.github.com/remora/build/node_minpkg.js`__ from Node::

    var remora = require("./path/to/node_minpkg.js");
    remora.render("Hello, ${what}!", { what: "Node.js" });
    
* Download the source package and copy whatever ``example/index.html`` does.
  This will use Closure's ``deps.js`` dependency handling.

.. __: http://wolever.github.com/remora/build/devpkg.js
.. __: http://wolever.github.com/remora/build/node_minpkg.js

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
            <% return; %>
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


