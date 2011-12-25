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
