"""
Wraps the content in a <script type="text/x-remora">...</script> tag so that
$EDITOR's syntax highlighting doesn't get confused.

For example::

    >>> print Template('''
    ...    {% remora id='my-template' %}
    ...        Hello, ${what}!
    ...    {% endremora %}
    ... ''').render()
    <script type='text/x-remora' id='my-template'>
        Hello, ${what}!
    </script>
    >>>

"""

from django import template

register = template.Library()

@register.tag
def remora(parser, token):
    """ {% remora [... attributes ...] %}... content ...{% endremora %} """
    nodelist = parser.parse(("endremora", ))
    tag_content = (token.contents.split(None, 1)[1:] or [""])[0]
    parser.delete_first_token()
    return RemoraNode(tag_content, nodelist)

class RemoraNode(template.Node):
    def __init__(self, tag_content, nodelist):
        self.nodelist = nodelist
        self.tag_content = tag_content

    def render(self, context):
        return "\n".join([
            "<script type='text/x-remora' %s>" %(self.tag_content, ),
            self.nodelist.render(context),
            "</script>",
        ])

