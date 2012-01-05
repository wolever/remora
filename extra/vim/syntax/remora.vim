" Language:    Remora
" License:     WTFPL

" Based on:
" Language:     Mako
" Maintainer:   Armin Ronacher <armin.ronacher@active-4.com>
" URL:          http://lucumr.pocoo.org/
" Last Change:  2008 September 12
" Version:	0.6.1

if version < 600
  syntax clear
elseif exists("b:current_syntax")
  finish
endif

if !exists("main_syntax")
  let main_syntax = "html"
endif

"Source the html syntax file
ru! syntax/html.vim
unlet b:current_syntax

"Put the JavaScript syntax file in @JavaScript
syn include @javascriptTop syntax/javascript.vim

" End keywords
syn keyword remoraEnd contained endfor endwhile endif endtry enddef

" Block rules
syn region remoraLine matchgroup=remoraDelim start=#^\s*%# end=#$# keepend contains=@javascriptTop,remoraEnd
syn region remoraBlock matchgroup=remoraDelim start=#<%!\?# end=#%># keepend contains=@javascriptTop,remoraEnd

" Variables
syn region remoraNested start="{" end="}" transparent display contained contains=remoraNested,@javascriptTop
syn region remoraVariable matchgroup=remoraDelim start=#\${# end=#}# contains=remoraNested,@javascriptTop

" Comments
syn region remoraComment start="^\s*##" end="$"
syn region remoraDocComment matchgroup=remoraDelim start="<%doc>" end="</%doc>" keepend

" Literal Blocks
syn region remoraText matchgroup=remoraDelim start="<%text[^>]*>" end="</%text>"

" Attribute Sublexing
syn match remoraAttributeKey containedin=remoraTag contained "[a-zA-Z_][a-zA-Z0-9_]*="
syn region remoraAttributeValue containedin=remoraTag contained start=/"/ skip=/\\"/ end=/"/
syn region remoraAttributeValue containedin=remoraTag contained start=/'/ skip=/\\'/ end=/'/

" Tags
syn region remoraTag matchgroup=remoraDelim start="<%\(def\|call\|page\|include\|namespace\|inherit\)\>" end="/\?>"
syn match remoraDelim "</%\(def\|call\|namespace\)>"

" Newline Escapes
syn match remoraEscape /\\$/

" Default highlighting links
if version >= 508 || !exists("did_remora_syn_inits")
  if version < 508
    let did_remora_syn_inits = 1
    com -nargs=+ HiLink hi link <args>
  else
    com -nargs=+ HiLink hi def link <args>
  endif

  HiLink remoraDocComment remoraComment
  HiLink remoraDefEnd remoraDelim

  HiLink remoraAttributeKey Type
  HiLink remoraAttributeValue String
  HiLink remoraText Normal
  HiLink remoraDelim Preproc
  HiLink remoraEnd Keyword
  HiLink remoraComment Comment
  HiLink remoraEscape Special

  delc HiLink
endif
