#!/bin/bash

VERSION = 0.1.0
DEV_VERSION = ${VERSION}-$(shell hg node --template "{rev}_{node|short}")-dev

ALL_FILES = $(shell find src/)
ORDERED_JS = $(shell closurebuilder.py --root src/ --namespace "remora") src/remora/jquery.js
PATH := node_modules/.bin/:${PATH}

dev: src/remora/parser.js src/browser/deps.js 

src/remora/parser.js: src/remora/grammar.pegjs
	pegjs -e "`printf '/* generated from grammar.pegjs */\ngoog.provide("remora.parser");\nremora.parser'`" $< $@

src/browser/deps.js: src/remora/parser.js ${ALL_FILES}
	depswriter.py --root_with_prefix="src/ ../" | \
		sed -e 's/autogenerated by .*/autogenerated by depswriter.py/' \
		> src/browser/deps.js

clean:
	rm -f src/browser/deps.js
	rm -f src/remora/parser.js
	rm -f build/*
	rm -f test/testrunner-*

build/package_base.js: src/remora/parser.js src/browser/deps.js ${ALL_FILES}
	mkdir build 2> /dev/null || true
	echo 'var REMORA_VERSION = "${DEV_VERSION}";' > $@
	echo 'var CLOSURE_NO_DEPS = true;' >> $@
	cat ${ORDERED_JS} >> $@

devpkg: build/devpkg.js
build/devpkg.js: build/package_base.js
	ln -f $< $@

node_minpkg: build/node_minpkg.js
build/node_minpkg.js: build/package_base.js
	cp $< $@.tmp
	echo "remora.__goog = goog;" >> $@.tmp
	echo "module.exports = remora" >> $@.tmp
	closure $@.tmp > $@
	rm $@.tmp

testrunners: devpkg node_minpkg
	./test/build_testrunners.js

test: testrunners
	echo "Run tests by opening or executing the testrunner-* files in test/, or running './test/test_all'"

gh-page:
	hg co gh-pages
	hg merge master
	make testrunners
	hg addremove test/
	hg addremove build/
	hg ci -m "Merge master -> gh-pages"
	hg co master
	hg push
