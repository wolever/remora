#!/bin/bash

VERSION = 0.1.0
DEV_VERSION = ${VERSION}-$(shell hg node --template "{rev}_{node|short}")-dev

ORDERED_JS = $(shell closurebuilder.py --root src/ --namespace "remora")
PATH := node_modules/.bin/:${PATH}

dev: src/remora/parser.js src/browser/deps.js 

src/remora/parser.js: src/remora/grammar.pegjs
	pegjs -e "`printf '/* generated from grammar.pegjs */\ngoog.provide("remora.parser");\nremora.parser'`" $< $@

src/browser/deps.js: src/*.js src/remora/*.js
	depswriter.py --root_with_prefix="src/ ../" | \
		sed -e 's/autogenerated by .*/autogenerated by depswriter.py/' \
		> src/browser/deps.js

clean:
	rm src/browser/deps.js
	rm src/remora/parser.js
	rm build/*

build/package_base.js: src/remora/parser.js
	cat ${ORDERED_JS} > $@

devpkg: build/package_base.js
	cp $^ build/remora-${DEV_VERSION}.js

gh-page:
	hg co gh-pages
	hg merge master
	hg ci -m "Merge master -> gh-pages"
	hg co master
	hg push
