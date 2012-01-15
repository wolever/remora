CLOSURE_NO_DEPS = true;
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {}; // Identifies this file as the Closure base.

/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(user): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide())
 *     in the form "goog.package.part".
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(arv): If we start to support require based on file name this has
  //            to change
  // TODO(arv): If we allow goog.foo.* this has to change
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


goog.provide("remora.utils");

remora.utils.extend = function(base) {
  for (var i = 1; i < arguments.length; i += 1) {
    var arg = arguments[i];
    for (var prop in arg) {
      if (arg.hasOwnProperty(prop)) {
        base[prop] = arg[prop];
      }
    }
  }

  return base;
};
/* generated from grammar.pegjs */
goog.provide("remora.parser");
remora.parser = (function(){
  /* Generated by PEG.js 0.6.2 (http://pegjs.majda.cz/). */
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "_": parse__,
        "_block_end": parse__block_end,
        "_block_expr": parse__block_expr,
        "_block_mid": parse__block_mid,
        "_block_mid_body": parse__block_mid_body,
        "_block_start": parse__block_start,
        "_block_start_body": parse__block_start_body,
        "_control_block": parse__control_block,
        "_doc": parse__doc,
        "code_block": parse_code_block,
        "control_block": parse_control_block,
        "doc": parse_doc,
        "exprbody": parse_exprbody,
        "expression": parse_expression,
        "filter": parse_filter,
        "line_start": parse_line_start,
        "markup": parse_markup,
        "nl": parse_nl,
        "root_doc": parse_root_doc,
        "var": parse_var
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "root_doc";
      }
      
      var pos = 0;
      var reportMatchFailures = true;
      var rightmostMatchFailuresPos = 0;
      var rightmostMatchFailuresExpected = [];
      var cache = {};
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        
        if (charCode <= 0xFF) {
          var escapeChar = 'x';
          var length = 2;
        } else {
          var escapeChar = 'u';
          var length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function quote(s) {
        /*
         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
         * string literal except for the closing quote character, backslash,
         * carriage return, line separator, paragraph separator, and line feed.
         * Any character may appear in the form of an escape sequence.
         */
        return '"' + s
          .replace(/\\/g, '\\\\')            // backslash
          .replace(/"/g, '\\"')              // closing quote character
          .replace(/\r/g, '\\r')             // carriage return
          .replace(/\n/g, '\\n')             // line feed
          .replace(/[\x80-\uFFFF]/g, escape) // non-ASCII characters
          + '"';
      }
      
      function matchFailed(failure) {
        if (pos < rightmostMatchFailuresPos) {
          return;
        }
        
        if (pos > rightmostMatchFailuresPos) {
          rightmostMatchFailuresPos = pos;
          rightmostMatchFailuresExpected = [];
        }
        
        rightmostMatchFailuresExpected.push(failure);
      }
      
      function parse_root_doc() {
        var cacheKey = 'root_doc@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = parse_doc();
        var result2 = result1 !== null
          ? (function(doc) {
            doc.computeLocation = computeLocation;
            return doc;
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_doc() {
        var cacheKey = 'doc@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = [];
        var result3 = parse__doc();
        while (result3 !== null) {
          result1.push(result3);
          var result3 = parse__doc();
        }
        var result2 = result1 !== null
          ? (function() {
            fixup_doc(cur_doc);
            return cur_doc;
          })()
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__doc() {
        var cacheKey = '_doc@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result5 = parse_markup();
        if (result5 !== null) {
          var result1 = result5;
        } else {
          var result4 = parse_nl();
          if (result4 !== null) {
            var result1 = result4;
          } else {
            if (input.length > pos) {
              var result3 = input.charAt(pos);
              pos++;
            } else {
              var result3 = null;
              if (reportMatchFailures) {
                matchFailed('any character');
              }
            }
            if (result3 !== null) {
              var result1 = result3;
            } else {
              var result1 = null;;
            };
          };
        }
        var result2 = result1 !== null
          ? (function(v) {
            if (typeof v === "string") {
              var last_child = cur_doc.children[cur_doc.children.length - 1] || {};
              if (last_child.type === "string") {
                last_child.value += v;
                v = undefined;
              } else {
                v = Node("string", {
                  value: v,
                  pos: pos - 1
                });
              }
            }
          
            if (v !== undefined) {
              cur_doc.children.push(v);
            }
          
            return cur_doc;
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_markup() {
        var cacheKey = 'markup@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result3 = parse_expression();
        if (result3 !== null) {
          var result0 = result3;
        } else {
          var result2 = parse_control_block();
          if (result2 !== null) {
            var result0 = result2;
          } else {
            var result1 = parse_code_block();
            if (result1 !== null) {
              var result0 = result1;
            } else {
              var result0 = null;;
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_expression() {
        var cacheKey = 'expression@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 2) === "${") {
          var result3 = "${";
          pos += 2;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"${\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_exprbody();
          if (result4 !== null) {
            if (input.substr(pos, 1) === "}") {
              var result5 = "}";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"}\"");
              }
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(body) {
            return Node("expression", {
              pos: pos - 1,
              expr: body.expr,
              filters: body.filter
            });
          })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_exprbody() {
        var cacheKey = 'exprbody@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos).match(/^[^}|]/) !== null) {
          var result5 = input.charAt(pos);
          pos++;
        } else {
          var result5 = null;
          if (reportMatchFailures) {
            matchFailed("[^}|]");
          }
        }
        if (result5 !== null) {
          var result3 = [];
          while (result5 !== null) {
            result3.push(result5);
            if (input.substr(pos).match(/^[^}|]/) !== null) {
              var result5 = input.charAt(pos);
              pos++;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("[^}|]");
              }
            }
          }
        } else {
          var result3 = null;
        }
        if (result3 !== null) {
          var result4 = parse_filter();
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(expr, f) {
            return {
              expr: expr.join(""),
              filter: f
            };
          })(result1[0], result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_filter() {
        var cacheKey = 'filter@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos1 = pos;
        var savedPos2 = pos;
        if (input.substr(pos, 1) === "|") {
          var result7 = "|";
          pos += 1;
        } else {
          var result7 = null;
          if (reportMatchFailures) {
            matchFailed("\"|\"");
          }
        }
        if (result7 !== null) {
          var result8 = [];
          if (input.substr(pos).match(/^[^}]/) !== null) {
            var result9 = input.charAt(pos);
            pos++;
          } else {
            var result9 = null;
            if (reportMatchFailures) {
              matchFailed("[^}]");
            }
          }
          while (result9 !== null) {
            result8.push(result9);
            if (input.substr(pos).match(/^[^}]/) !== null) {
              var result9 = input.charAt(pos);
              pos++;
            } else {
              var result9 = null;
              if (reportMatchFailures) {
                matchFailed("[^}]");
              }
            }
          }
          if (result8 !== null) {
            var result5 = [result7, result8];
          } else {
            var result5 = null;
            pos = savedPos2;
          }
        } else {
          var result5 = null;
          pos = savedPos2;
        }
        var result6 = result5 !== null
          ? (function(filter) {
            return filter.join("").split(",");
          })(result5[1])
          : null;
        if (result6 !== null) {
          var result4 = result6;
        } else {
          var result4 = null;
          pos = savedPos1;
        }
        if (result4 !== null) {
          var result0 = result4;
        } else {
          var savedPos0 = pos;
          if (input.substr(pos, 0) === "") {
            var result2 = "";
            pos += 0;
          } else {
            var result2 = null;
            if (reportMatchFailures) {
              matchFailed("\"\"");
            }
          }
          var result3 = result2 !== null
            ? (function() { return []; })()
            : null;
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_control_block() {
        var cacheKey = 'control_block@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos2 = pos;
        var savedPos3 = pos;
        var result14 = parse_line_start();
        if (result14 !== null) {
          var result15 = [];
          var result17 = parse__();
          while (result17 !== null) {
            result15.push(result17);
            var result17 = parse__();
          }
          if (result15 !== null) {
            if (input.substr(pos, 2) === "%%") {
              var result16 = "%%";
              pos += 2;
            } else {
              var result16 = null;
              if (reportMatchFailures) {
                matchFailed("\"%%\"");
              }
            }
            if (result16 !== null) {
              var result12 = [result14, result15, result16];
            } else {
              var result12 = null;
              pos = savedPos3;
            }
          } else {
            var result12 = null;
            pos = savedPos3;
          }
        } else {
          var result12 = null;
          pos = savedPos3;
        }
        var result13 = result12 !== null
          ? (function(line) {
            return line.join("") + "%";
          })(result12[1])
          : null;
        if (result13 !== null) {
          var result11 = result13;
        } else {
          var result11 = null;
          pos = savedPos2;
        }
        if (result11 !== null) {
          var result0 = result11;
        } else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          var result4 = parse_line_start();
          if (result4 !== null) {
            var result5 = [];
            var result10 = parse__();
            while (result10 !== null) {
              result5.push(result10);
              var result10 = parse__();
            }
            if (result5 !== null) {
              if (input.substr(pos, 1) === "%") {
                var result6 = "%";
                pos += 1;
              } else {
                var result6 = null;
                if (reportMatchFailures) {
                  matchFailed("\"%\"");
                }
              }
              if (result6 !== null) {
                var result9 = parse__();
                var result7 = result9 !== null ? result9 : '';
                if (result7 !== null) {
                  var result8 = parse__control_block();
                  if (result8 !== null) {
                    var result2 = [result4, result5, result6, result7, result8];
                  } else {
                    var result2 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result2 = null;
                  pos = savedPos1;
                }
              } else {
                var result2 = null;
                pos = savedPos1;
              }
            } else {
              var result2 = null;
              pos = savedPos1;
            }
          } else {
            var result2 = null;
            pos = savedPos1;
          }
          var result3 = result2 !== null
            ? (function(b) {
              return b;
            })(result2[4])
            : null;
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__control_block() {
        var cacheKey = '_control_block@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos1 = pos;
        var result10 = parse__block_start();
        if (result10 !== null) {
          var result6 = result10;
        } else {
          var result9 = parse__block_mid();
          if (result9 !== null) {
            var result6 = result9;
          } else {
            var result8 = parse__block_end();
            if (result8 !== null) {
              var result6 = result8;
            } else {
              var result6 = null;;
            };
          };
        }
        var result7 = result6 !== null
          ? (function(block) {
            return block;
          })(result6)
          : null;
        if (result7 !== null) {
          var result5 = result7;
        } else {
          var result5 = null;
          pos = savedPos1;
        }
        if (result5 !== null) {
          var result0 = result5;
        } else {
          var savedPos0 = pos;
          var result2 = [];
          if (input.substr(pos).match(/^[^\n]/) !== null) {
            var result4 = input.charAt(pos);
            pos++;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("[^\\n]");
            }
          }
          while (result4 !== null) {
            result2.push(result4);
            if (input.substr(pos).match(/^[^\n]/) !== null) {
              var result4 = input.charAt(pos);
              pos++;
            } else {
              var result4 = null;
              if (reportMatchFailures) {
                matchFailed("[^\\n]");
              }
            }
          }
          var result3 = result2 !== null
            ? (function(line) {
              pos -= line.length;
              throw new ParseError("invalid control line: " + line.join(""));
            })(result2)
            : null;
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__block_start() {
        var cacheKey = '_block_start@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse__block_start_body();
        if (result3 !== null) {
          if (input.substr(pos, 1) === ":") {
            var result4 = ":";
            pos += 1;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\":\"");
            }
          }
          if (result4 !== null) {
            var result5 = parse_nl();
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(bl_options) {
            bl_options.pos = pos - 1;
            var block = Node("controlblock", bl_options);
            block.body = DocNode();
          
            doc_stack.push(cur_doc);
            cur_doc = block.body;
          
            block_stack.push(cur_block);
            cur_block = block;
          })(result1[0])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__block_start_body() {
        var cacheKey = '_block_start_body@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos2 = pos;
        var savedPos3 = pos;
        if (input.substr(pos, 3) === "for") {
          var result11 = "for";
          pos += 3;
        } else {
          var result11 = null;
          if (reportMatchFailures) {
            matchFailed("\"for\"");
          }
        }
        if (result11 !== null) {
          var result28 = parse__();
          if (result28 !== null) {
            var result12 = [];
            while (result28 !== null) {
              result12.push(result28);
              var result28 = parse__();
            }
          } else {
            var result12 = null;
          }
          if (result12 !== null) {
            var result13 = parse_var();
            if (result13 !== null) {
              var savedPos4 = pos;
              var savedPos5 = pos;
              var result22 = [];
              var result27 = parse__();
              while (result27 !== null) {
                result22.push(result27);
                var result27 = parse__();
              }
              if (result22 !== null) {
                if (input.substr(pos, 1) === ",") {
                  var result23 = ",";
                  pos += 1;
                } else {
                  var result23 = null;
                  if (reportMatchFailures) {
                    matchFailed("\",\"");
                  }
                }
                if (result23 !== null) {
                  var result24 = [];
                  var result26 = parse__();
                  while (result26 !== null) {
                    result24.push(result26);
                    var result26 = parse__();
                  }
                  if (result24 !== null) {
                    var result25 = parse_var();
                    if (result25 !== null) {
                      var result20 = [result22, result23, result24, result25];
                    } else {
                      var result20 = null;
                      pos = savedPos5;
                    }
                  } else {
                    var result20 = null;
                    pos = savedPos5;
                  }
                } else {
                  var result20 = null;
                  pos = savedPos5;
                }
              } else {
                var result20 = null;
                pos = savedPos5;
              }
              var result21 = result20 !== null
                ? (function(v) { return v })(result20[3])
                : null;
              if (result21 !== null) {
                var result19 = result21;
              } else {
                var result19 = null;
                pos = savedPos4;
              }
              var result14 = result19 !== null ? result19 : '';
              if (result14 !== null) {
                var result18 = parse__();
                if (result18 !== null) {
                  var result15 = [];
                  while (result18 !== null) {
                    result15.push(result18);
                    var result18 = parse__();
                  }
                } else {
                  var result15 = null;
                }
                if (result15 !== null) {
                  if (input.substr(pos, 2) === "in") {
                    var result16 = "in";
                    pos += 2;
                  } else {
                    var result16 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"in\"");
                    }
                  }
                  if (result16 !== null) {
                    var result17 = parse__block_expr();
                    if (result17 !== null) {
                      var result9 = [result11, result12, result13, result14, result15, result16, result17];
                    } else {
                      var result9 = null;
                      pos = savedPos3;
                    }
                  } else {
                    var result9 = null;
                    pos = savedPos3;
                  }
                } else {
                  var result9 = null;
                  pos = savedPos3;
                }
              } else {
                var result9 = null;
                pos = savedPos3;
              }
            } else {
              var result9 = null;
              pos = savedPos3;
            }
          } else {
            var result9 = null;
            pos = savedPos3;
          }
        } else {
          var result9 = null;
          pos = savedPos3;
        }
        var result10 = result9 !== null
          ? (function(v0, v1, e) {
            var vars  = [v0];
            if (v1)
              vars.push(v1);
            return {
              expr: e,
              keyword: "for",
              vars: vars
            };
          })(result9[2], result9[3], result9[6])
          : null;
        if (result10 !== null) {
          var result8 = result10;
        } else {
          var result8 = null;
          pos = savedPos2;
        }
        if (result8 !== null) {
          var result0 = result8;
        } else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          if (input.substr(pos, 2) === "if") {
            var result7 = "if";
            pos += 2;
          } else {
            var result7 = null;
            if (reportMatchFailures) {
              matchFailed("\"if\"");
            }
          }
          if (result7 !== null) {
            var result4 = result7;
          } else {
            if (input.substr(pos, 5) === "while") {
              var result6 = "while";
              pos += 5;
            } else {
              var result6 = null;
              if (reportMatchFailures) {
                matchFailed("\"while\"");
              }
            }
            if (result6 !== null) {
              var result4 = result6;
            } else {
              var result4 = null;;
            };
          }
          if (result4 !== null) {
            var result5 = parse__block_expr();
            if (result5 !== null) {
              var result2 = [result4, result5];
            } else {
              var result2 = null;
              pos = savedPos1;
            }
          } else {
            var result2 = null;
            pos = savedPos1;
          }
          var result3 = result2 !== null
            ? (function(kw, e) {
              return {
                expr: e,
                keyword: kw
              };
            })(result2[0], result2[1])
            : null;
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__block_mid() {
        var cacheKey = '_block_mid@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse__block_mid_body();
        if (result3 !== null) {
          var result4 = [];
          var result7 = parse__();
          while (result7 !== null) {
            result4.push(result7);
            var result7 = parse__();
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === ":") {
              var result5 = ":";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\":\"");
              }
            }
            if (result5 !== null) {
              var result6 = parse_nl();
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(bl_options) {
            bl_options.pos = pos - 1;
            var block = Node("controlblock", bl_options);
            block.body = DocNode();
          
            if (!cur_block.sub_blocks)
              cur_block.sub_blocks = [];
            cur_block.sub_blocks.push(block);
          
            fixup_doc(cur_doc);
            cur_doc = block.body;
          })(result1[0])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__block_mid_body() {
        var cacheKey = '_block_mid_body@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos1 = pos;
        var savedPos2 = pos;
        if (input.substr(pos, 4) === "elif") {
          var result7 = "elif";
          pos += 4;
        } else {
          var result7 = null;
          if (reportMatchFailures) {
            matchFailed("\"elif\"");
          }
        }
        if (result7 !== null) {
          var result10 = parse__();
          if (result10 !== null) {
            var result8 = [];
            while (result10 !== null) {
              result8.push(result10);
              var result10 = parse__();
            }
          } else {
            var result8 = null;
          }
          if (result8 !== null) {
            var result9 = parse__block_expr();
            if (result9 !== null) {
              var result5 = [result7, result8, result9];
            } else {
              var result5 = null;
              pos = savedPos2;
            }
          } else {
            var result5 = null;
            pos = savedPos2;
          }
        } else {
          var result5 = null;
          pos = savedPos2;
        }
        var result6 = result5 !== null
          ? (function(e) {
            assertCurrentBlockIfElif("elif");
            return {
              keyword: "elif",
              expr: e
            };
          })(result5[2])
          : null;
        if (result6 !== null) {
          var result4 = result6;
        } else {
          var result4 = null;
          pos = savedPos1;
        }
        if (result4 !== null) {
          var result0 = result4;
        } else {
          var savedPos0 = pos;
          if (input.substr(pos, 4) === "else") {
            var result2 = "else";
            pos += 4;
          } else {
            var result2 = null;
            if (reportMatchFailures) {
              matchFailed("\"else\"");
            }
          }
          var result3 = result2 !== null
            ? (function() {
              assertCurrentBlockIfElif("else");
              return {
                keyword: "else"
              };
            })()
            : null;
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__block_expr() {
        var cacheKey = '_block_expr@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result6 = parse__();
        while (result6 !== null) {
          result3.push(result6);
          var result6 = parse__();
        }
        if (result3 !== null) {
          if (input.substr(pos).match(/^[^:]/) !== null) {
            var result5 = input.charAt(pos);
            pos++;
          } else {
            var result5 = null;
            if (reportMatchFailures) {
              matchFailed("[^:]");
            }
          }
          if (result5 !== null) {
            var result4 = [];
            while (result5 !== null) {
              result4.push(result5);
              if (input.substr(pos).match(/^[^:]/) !== null) {
                var result5 = input.charAt(pos);
                pos++;
              } else {
                var result5 = null;
                if (reportMatchFailures) {
                  matchFailed("[^:]");
                }
              }
            }
          } else {
            var result4 = null;
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(e) {
            return e.join("");
          })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__block_end() {
        var cacheKey = '_block_end@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 3) === "end") {
          var result3 = "end";
          pos += 3;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"end\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_var();
          if (result4 !== null) {
            var result5 = parse_nl();
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(keyword) {
            var cur_begin_keyword = (cur_block || {}).keyword;
            if (keyword !== cur_begin_keyword)
              throw Error("Ending block " + keyword + " which hasn't been started " +
                          "(current block: " + cur_begin_keyword + ")");
            fixup_doc(cur_doc);
            cur_doc = doc_stack.pop();
            var this_block = cur_block;
            cur_block = block_stack.pop();
            return this_block;
          })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_code_block() {
        var cacheKey = 'code_block@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 2) === "<%") {
          var result3 = "<%";
          pos += 2;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"<%\"");
          }
        }
        if (result3 !== null) {
          var savedPos2 = pos;
          var savedPos3 = pos;
          var savedPos4 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          if (input.substr(pos, 2) === "%>") {
            var result11 = "%>";
            pos += 2;
          } else {
            var result11 = null;
            if (reportMatchFailures) {
              matchFailed("\"%>\"");
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if (result11 === null) {
            var result9 = '';
          } else {
            var result9 = null;
            pos = savedPos4;
          }
          if (result9 !== null) {
            if (input.length > pos) {
              var result10 = input.charAt(pos);
              pos++;
            } else {
              var result10 = null;
              if (reportMatchFailures) {
                matchFailed('any character');
              }
            }
            if (result10 !== null) {
              var result7 = [result9, result10];
            } else {
              var result7 = null;
              pos = savedPos3;
            }
          } else {
            var result7 = null;
            pos = savedPos3;
          }
          var result8 = result7 !== null
            ? (function(ch) { return ch })(result7[1])
            : null;
          if (result8 !== null) {
            var result6 = result8;
          } else {
            var result6 = null;
            pos = savedPos2;
          }
          if (result6 !== null) {
            var result4 = [];
            while (result6 !== null) {
              result4.push(result6);
              var savedPos2 = pos;
              var savedPos3 = pos;
              var savedPos4 = pos;
              var savedReportMatchFailuresVar0 = reportMatchFailures;
              reportMatchFailures = false;
              if (input.substr(pos, 2) === "%>") {
                var result11 = "%>";
                pos += 2;
              } else {
                var result11 = null;
                if (reportMatchFailures) {
                  matchFailed("\"%>\"");
                }
              }
              reportMatchFailures = savedReportMatchFailuresVar0;
              if (result11 === null) {
                var result9 = '';
              } else {
                var result9 = null;
                pos = savedPos4;
              }
              if (result9 !== null) {
                if (input.length > pos) {
                  var result10 = input.charAt(pos);
                  pos++;
                } else {
                  var result10 = null;
                  if (reportMatchFailures) {
                    matchFailed('any character');
                  }
                }
                if (result10 !== null) {
                  var result7 = [result9, result10];
                } else {
                  var result7 = null;
                  pos = savedPos3;
                }
              } else {
                var result7 = null;
                pos = savedPos3;
              }
              var result8 = result7 !== null
                ? (function(ch) { return ch })(result7[1])
                : null;
              if (result8 !== null) {
                var result6 = result8;
              } else {
                var result6 = null;
                pos = savedPos2;
              }
            }
          } else {
            var result4 = null;
          }
          if (result4 !== null) {
            if (input.substr(pos, 2) === "%>") {
              var result5 = "%>";
              pos += 2;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"%>\"");
              }
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(body) {
            return Node("codeblock", {
              pos: pos - 2,
              body: body.join("")
            });
          })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_var() {
        var cacheKey = 'var@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        if (input.substr(pos).match(/^[a-zA-Z_0-9$]/) !== null) {
          var result3 = input.charAt(pos);
          pos++;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("[a-zA-Z_0-9$]");
          }
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            if (input.substr(pos).match(/^[a-zA-Z_0-9$]/) !== null) {
              var result3 = input.charAt(pos);
              pos++;
            } else {
              var result3 = null;
              if (reportMatchFailures) {
                matchFailed("[a-zA-Z_0-9$]");
              }
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(v) { return v.join(""); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse__() {
        var cacheKey = '_@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        if (input.substr(pos).match(/^[ 	]/) !== null) {
          var result1 = input.charAt(pos);
          pos++;
        } else {
          var result1 = null;
          if (reportMatchFailures) {
            matchFailed("[ 	]");
          }
        }
        var result2 = result1 !== null
          ? (function(text) {
            return text;
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_line_start() {
        var cacheKey = 'line_start@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result0 = (function() {
          return input[pos-1] == "\n" || pos == 0;
        })() ? '' : null;
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_nl() {
        var cacheKey = 'nl@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = [];
        var result5 = parse__();
        while (result5 !== null) {
          result3.push(result5);
          var result5 = parse__();
        }
        if (result3 !== null) {
          if (input.substr(pos, 1) === "\n") {
            var result4 = "\n";
            pos += 1;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"\\n\"");
            }
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(text) {
            return text[0].join("") + text[1];
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function buildErrorMessage() {
        function buildExpected(failuresExpected) {
          failuresExpected.sort();
          
          var lastFailure = null;
          var failuresExpectedUnique = [];
          for (var i = 0; i < failuresExpected.length; i++) {
            if (failuresExpected[i] !== lastFailure) {
              failuresExpectedUnique.push(failuresExpected[i]);
              lastFailure = failuresExpected[i];
            }
          }
          
          switch (failuresExpectedUnique.length) {
            case 0:
              return 'end of input';
            case 1:
              return failuresExpectedUnique[0];
            default:
              return failuresExpectedUnique.slice(0, failuresExpectedUnique.length - 1).join(', ')
                + ' or '
                + failuresExpectedUnique[failuresExpectedUnique.length - 1];
          }
        }
        
        var expected = buildExpected(rightmostMatchFailuresExpected);
        var actualPos = Math.max(pos, rightmostMatchFailuresPos);
        var actual = actualPos < input.length
          ? quote(input.charAt(actualPos))
          : 'end of input';
        
        return 'Expected ' + expected + ' but ' + actual + ' found.';
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i <  rightmostMatchFailuresPos; i++) {
          var ch = input.charAt(i);
          if (ch === '\n') {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === '\r' | ch === '\u2028' || ch === '\u2029') {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      
    function computeLocation(pos) {
      
      // Note: this differs slightly from PegJS's 'compute location' function
      
      // as it considers newlines to be part of the line, not part of the next
      
      // line (ex, if the input is "a\nb", then `computeLocation(1)` (ie, the
      
      // '\n') will return `line: 1`, not `line: 2`).
      
  
      
      if (pos < 0)
      
        return { line: -1, column: -1, pos: pos };
      
      if (pos > input.length)
      
        pos = input.length;
      
  
      
      var line = 1;
      
      var column = 1;
      
      var seenNL = false;
      
  
      
      for (var i = 0; i < pos; i += 1) {
      
        if (seenNL) {
      
          line += 1;
      
          column = 0;
      
          seenNL = false;
      
        }
      
        column += 1;
      
  
      
        switch (input.charAt(i)) {
      
          case '\r':
      
          case '\u2028':
      
          case '\u2029':
      
            if (i + 1 < pos && input.charAt(i + 1) === '\n')
      
              continue;
      
          case '\n':
      
            seenNL = true;
      
        }
      
      }
      
  
      
      return { line: line, column: column, pos: pos };
      
    }
      
  
      
    function Node(type, options) {
      
      options = options || {};
      
      options.type = type;
      
      if (options.pos === undefined)
      
        throw Error("Node " + type + " doesn't define a 'pos'!");
      
      return options;
      
    }
      
  
      
    function ParseError(message) {
      
      this.location = computeLocation(pos);
      
      this.msg = message;
      
      this.message = this.toString();
      
    }
      
  
      
    ParseError.prototype.toString = function() {
      
      var loc = this.location;
      
      return "ParseError at " + loc.line + ":" + pos.column + ": " + this.msg;
      
    };
      
  
      
    function assertCurrentBlockIfElif(keyword) {
      
      var prev_keyword = (cur_block || {}).keyword
      
      if (prev_keyword == "if") {
      
        var sub_blocks = cur_block.sub_blocks || [];
      
        if (sub_blocks.length == 0)
      
          return;
      
        prev_keyword = sub_blocks[sub_blocks.length - 1].keyword;
      
        if (prev_keyword == "elif")
      
          return;
      
      }
      
      throw new ParseError("'" + keyword + "' must come after an 'if' or " +
      
                           "'elif', not '" + prev_keyword + "'.");
      
    }
      
  
      
    function DocNode() {
      
      return Node("doc", {
      
        pos: pos,
      
        children: []
      
      });
      
    };
      
  
      
    function fixup_doc(d) {
      
      if (d.added_nl) {
      
        delete d.added_nl;
      
        var last_child = d.children[d.children.length - 1];
      
        if ((last_child || {}).type === "string")
      
          last_child.value = last_child.value.slice(0, -1)
      
      }
      
    }
      
  
      
    var doc_stack = [];
      
    var cur_doc = DocNode();
      
  
      
    var block_stack = [];
      
    var cur_block = null;
      
  
      
    if (input.length > 0 && input[input.length - 1] != "\n") {
      
      cur_doc.added_nl = true;
      
      input += "\n";
      
    }
      
  
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostMatchFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostMatchFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostMatchFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var errorPosition = computeErrorPosition();
        throw new this.SyntaxError(
          buildErrorMessage(),
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(message, line, column) {
    this.name = 'SyntaxError';
    this.message = message;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
goog.provide("remora.ASTWalker");

remora.ASTWalker = function() {
  var self = {};

  self.walk = function(node) {
    var walker = self["walk_" + node.type];
    if (walker === undefined)
      throw Error("ASTWalker: unknown node type: " + node.type);

    if (walker)
      walker(node);
  };

  // Nodes which have no children don't need to be walked.
  self.walk_string = null;
  self.walk_expression = null;
  self.walk_codeblock = null;

  self.walk_doc = function(node) {
    for (var i = 0; i < node.children.length; i += 1)
      self.walk(node.children[i]);
  };

  self.walk_controlblock = function(node) {
    self.walk(node.body);

    var sub_blocks = node.sub_blocks || [];
    for (var i = 0; i < sub_blocks.length; i += 1)
      self.walk(sub_blocks[i]);
  };

  return self;
};
goog.require("remora.ASTWalker");

goog.provide("remora.AST2JS");

remora.AST2JS = function() {
  var self = remora.ASTWalker();

  var quoteable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var quoted = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\'
  };

  // Taken from json2.js
  self.quote = function(string) {
    quoteable.lastIndex = 0;
    return quoteable.test(string) ? '"' + string.replace(quoteable, function (a){
      var c = quoted[a];
      return typeof c === 'string'
        ? c
        : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  }

  self.emit = function(fragment) {
    var offset = 0;
    while ((offset = fragment.indexOf("\n", offset) + 1) > 0)
      self._resultLine += 1;
    self._result.push(fragment);
  };

  self.convert = function(tree) {
    self._resultLine = 1;
    self._positionMappings = [];
    self._result = [];

    self.emit(
      "(function() {\n" +
      "  return (function(__context) {\n" +
      "    with(__context.data || {}) {\n"
    );
    self.walk(tree);
    self.emit(
      "    }\n" +
      "  });\n" +
      "})()"
    );
    var source = self._result.join("");
    var positionMappings = self._positionMappings;
    var result = {
      source: source,
      sourceLineToTemplatePos: function(sourceLine) {
        var pos = -1;
        for (var i = 0; i < positionMappings.length; i += 1) {
          var mapping = positionMappings[i];
          if (sourceLine < mapping[0])
            break;
          pos = mapping[1];
        }

        return pos;
      }
    };
    delete self._result;
    delete self._positionMappings;
    delete self._resultLine;
    return result;
  };

  self.notePosition = function(templatePos, jsAtNode) {
    if (jsAtNode && jsAtNode.indexOf("\n") >= 0) {
      var basePos = templatePos - jsAtNode.length;
      var posOffset = -1;
      var lineOffset = -1;
      while ((posOffset = jsAtNode.indexOf("\n", posOffset + 1)) >= 0) {
        lineOffset += 1;
        self._positionMappings.push([
          self._resultLine + lineOffset,
          basePos + posOffset
        ]);
      }
    } else {
      self._positionMappings.push([self._resultLine, templatePos]);
    }
  };

  self.walk_string = function(node) {
    self.notePosition(node.pos);
    self.emit("__context.write(" + self.quote(node.value) + ");\n");
  };

  self.walk_expression = function(node) {
    self.notePosition(node.pos, node.expr);
    self.emit("__context.write(");
    var filter_closeparens = "";
    for (var i = node.filters.length - 1; i >= 0; i -= 1) {
      var filter = node.filters[i];
      self.emit("__context.filter(" + self.quote(filter) + ", ");
      filter_closeparens += ")";
    }
    self.emit("(" + node.expr + ")");
    self.emit(filter_closeparens + ");\n");
  };

  self._curUniqueVar = 0;
  self._mkUniqueVar = function(suffix) {
    suffix = suffix || "remoraUniqueVar";
    return "__remora" + suffix + self._curUniqueVar++;
  }

  self.walk_controlblock = function(node) {
    self.notePosition(node.pos);
    var end_block = "}\n";
    if (node.keyword == "for") {
      var iterable = self._mkUniqueVar("loopIterable");
      var loopIndex;
      var loopItem;
      if (node.vars.length == 1) {
        loopIndex = self._mkUniqueVar("loopIndex");
        loopItem = node.vars[0];
      } else {
        loopIndex = node.vars[0];
        loopItem = node.vars[1];
      }
      self.emit("var " + iterable + " = (" + node.expr + ");\n");
      self.emit("for (var " + loopIndex + " in " + iterable + ") {\n");
      self.emit("  if (" + iterable + ".hasOwnProperty(" + loopIndex + ")) {\n");
      self.emit("    var " + loopItem + " = " + iterable + "[" + loopIndex + "];\n");
      end_block = "  }\n}\n";
    } else if (node.keyword == "if" || node.keyword == "while") {
      self.emit(node.keyword + " (" + node.expr + ") {\n");
    } else if (node.keyword == "elif") {
      self.emit("else if (" + node.expr + ") {\n");
    } else if (node.keyword == "else") {
      self.emit("else {\n");
    } else {
      throw Error("unknown control block keyword: " + node.keyword);
    }

    self.walk(node.body);
    self.emit(end_block);

    var sub_blocks = node.sub_blocks || [];
    for (var i = 0; i < sub_blocks.length; i += 1) {
      var sub_block = sub_blocks[i];
      self.walk(sub_block);
    }
  };

  self.walk_codeblock = function(node) {
    var code = node.body + "\n";
    self.notePosition(node.pos, code);
    self.emit(code);
  };

  return self;
};
goog.provide("remora.evaler");

remora.evaler = (function() {
  // Note: because not all environments support line numbers in errors, it
  // might be useful to add an 'evalAsync' function at some point in the future
  // which will evaluate the code by appending a "<script>" element to the
  // document. This was attempted (search commit log for 'evaler.evalAsync'),
  // but the details turn out to be kind of annoying, so it wasn't finished.

  if (typeof console !== "undefined") {
    function debug() {
      console.log.apply(console, arguments);
    }
  } else {
    function debug() {};
  }

  var stackLineRE = /^(.*)@((http|file).*):([\d]*)$/
  var parseStackTrace = function(stack) {
    if (!stack)
      return null;

    var lines = stack.split(/\n/); 
    var result = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      if (!line.length)
        continue;
      var lineParsed = stackLineRE.exec(line);
      if (!lineParsed) {
        // Because Firefox is awesome and includes all the arguments passed to
        // every function, even valid stack traces can contain invalid lines.
        // Ignore those.
        continue;
      }
      result.push({
        func: lineParsed[1],
        fileName: lineParsed[2],
        lineNumber: parseInt(lineParsed[4] || -1)
      });
    }

    if (result.length < lines.length * 0.1) {
      // If fewer than 10% of the lines were valid stack lines, assume that we
      // couldn't parse the stack trace. 10% is entirely arbitrary and "feels
      // like a good number".
      return null;
    }

    result.toStackString = _parsedStackToString;
    return result;
  }

  function _parsedStackToString() {
    var result = [];
    for (var i = 0; i < this.length; i += 1) {
      var frame = this[i];
      result.push([frame.func, "@", frame.fileName, ":", frame.lineNumber].join(""));
    }
    return result.join("\n") + "\n";
  }

  var evalSync = function(js) {
    try {
      // The parens are added around the JS to ensure that it is a simple
      // expression and not an arbitrary block of code. This will make the
      // (potential) future implementaiton of an 'evalAsync' less painful.
      return eval(evalSync.codeOffsetNewlines + "(" + js + ")");
    } catch (e) {
      e.source = js;
      e.hasIncorrectLineNumbers = true;
      throw e;
    }
  };

  var fixExceptionLineNumbers = function(e, evaledCodeFileName) {
    var self = fixExceptionLineNumbers;
    evaledCodeFileName = evaledCodeFileName || "(evalered)";

    if (!self.supported) {
      e.hasIncorrectLineNumbers = true;
      return;
    }

    delete e.hasIncorrectLineNumbers;
    
    var stack = parseStackTrace(e.stack);
    if (!stack) {
      e.hasIncorrectLineNumbers = true;
      return;
    }

    for (var i = 0; i < stack.length; i += 1) {
      var frame = stack[i];
      if (frame.fileName == self.fileName && frame.lineNumber > self.evaledCodeOffset) {
        frame.fileName = evaledCodeFileName;
        frame.lineNumber -= self.evaledCodeOffset;
      }
    }

    if (e.fileName == self.fileName && e.lineNumber > self.evaledCodeOffset) {
      e.originalFileName = e.fileName;
      e.originalLineNumber = e.lineNumber;
      e.fileName = evaledCodeFileName;
      e.lineNumber -= self.evaledCodeOffset;
    }

    e.originalStack = e.stack;
    e.stack = stack.toStackString();
    e.parsedStack = stack;
  };

  // ***********************************************
  // * DO NOT DEFINE ANY FUNCTIONS BELOW THIS LINE *
  // ***********************************************
  // Because stack traces which point to eval'd code claim that that eval'd
  // code is part of the file which eval'd it, we need to make sure that all
  // code we eval has a line offset that's greater than any functions defined
  // in this file so that 'fixExceptionLineNumbers' can distinguish between it
  // and stack frames which point to legitimate code in this file.  The block
  // of code below determines that offset, so it is important not to define any
  // functions below here, otherwise they will be confused with eval'd code in
  // stack traces.

  try {
    throw Error();
  } catch (e) {
    var stack = parseStackTrace(e.stack);
    if (stack) {
      fixExceptionLineNumbers.fileName = stack[0].fileName;
      fixExceptionLineNumbers.supported = stack[0].lineNumber > 0;
    }
    if (e.lineNumber) {
      evalSync.codeOffsetNewlines = new Array(e.lineNumber + 1).join("\n");
    } else {
      evalSync.codeOffsetNewlines = "";
    }
  }

  // Now determine the line number offset of code eval'd with 'evalSync'...
  if (fixExceptionLineNumbers.supported) {
    fixExceptionLineNumbers.evaledCodeOffset = 0;
    try {
      evalSync("(function() { throw Error(); })()");
    } catch (e) {
      fixExceptionLineNumbers.evaledCodeOffset = e.lineNumber - 1;
    }
  }

  return {
    parseStackTrace: parseStackTrace,
    evalSync: evalSync,
    fixExceptionLineNumbers: fixExceptionLineNumbers
  };

})();
goog.require("remora.ASTWalker");

goog.provide("remora.ASTTransforms");

remora.ASTTransforms = function(template) {
  var self = remora.ASTWalker();
  self.template = template;

  self.walk_expression = function(node) {
    if (node.filters.indexOf("n") < 0)
      node.filters.push.apply(node.filters, template.defaultFilters);
  };

  return self;
};
goog.require("remora.utils");
goog.require("remora.parser");
goog.require("remora.AST2JS");
goog.require("remora.ASTTransforms");
goog.require("remora.evaler");

goog.provide("remora");

remora.version = goog.global.REMORA_VERSION || "dev";

remora.RenderContext = function(options) {
  var self = remora.utils.extend({
    buffer: [],
    data: {}
  }, options);

  self.filter = function(filterName, text) {
    if (filterName === "n")
      return text;

    var func = remora.RenderContext.builtinFilters[filterName];
    if (!func)
      throw Error("no such filter: " + filterName);

    // All built-in filters assume that the input is a string, so make sure
    // that's true here. This shouldn't be done for user filters, though, as
    // they might expect some other type of input.
    if (typeof text !== "string")
      text = "" + text;

    return func(text);
  };

  self.write = function(text) {
    self.buffer.push(text);
  };

  return self;
};

remora.Template = function(text, options) {
  var self = remora.utils.extend({
    converter: remora.AST2JS(),
    defaultFilters: ["h"]
  }, options || {});

  self.transforms = self.transforms || remora.ASTTransforms(self);

  self.setText = function(text) {
    self.text = "" + text;
    self.compile();
  };

  self._fixupRenderException = function(e) {
    var templateFileName = "<remora template>";
    remora.evaler.fixExceptionLineNumbers(e, templateFileName);
    e.templateLocation = {};
    if (e.hasIncorrectLineNumbers)
      return;

    var templatePos;
    var firstTemplateLoc;
    var templateLoc;
    for (var i = 0; i < e.parsedStack.length; i += 1) {
      var frame = e.parsedStack[i];
      if (frame.fileName == templateFileName) {
        templatePos = self._js.sourceLineToTemplatePos(frame.lineNumber);
        templateLoc = self._parsed.computeLocation(templatePos);
        frame.lineNumber = templateLoc.line;
        if (!firstTemplateLoc)
          firstTemplateLoc = templateLoc;
      }
    }

    if (templateLoc)
      e.stack = e.parsedStack.toStackString()

    if (e.fileName == templateFileName) {
      templatePos = self._js.sourceLineToTemplatePos(e.lineNumber);
      templateLoc = self._parsed.computeLocation(templatePos);
      e.generatedSourceLineNumber = e.lineNumber;
      e.lineNumber = templateLoc.line;
      if (!firstTemplateLoc)
        firstTemplateLoc = templateLoc;
    }

    if (templateLoc)
      e.templateLocation = firstTemplateLoc;

  };

  self.compile = function() {
    self._parsed = remora.parser.parse(self.text);
    self.transforms.walk(self._parsed);
    self._js = self.converter.convert(self._parsed);
    try {
      self._render = remora.evaler.evalSync(self._js.source);
    } catch (e) {
      goog.global.__bad_script = self._js.source;
      goog.global.__eval_error = e;
      self._fixupRenderException(e);
      if (e.hasIncorrectLineNumbers) {
        e.message = (
          "with generated JavaScript (see global __bad_script) line " +
          e.lineNumber + " (note: template line number unavailable; try " +
          "using Firefox): " + e.message
        );
      } else {
        e.message = (
          "with generated JavaScript (see global __bad_script). Error " +
          "caused by template line " + e.templateLocation.line + ": " +
          e.message
        );
      }
      throw e;
    }
  };

  self.render = function(data) {
    var context = remora.RenderContext({
      data: data
    });
    try {
      self._render(context);
    } catch (e) {
      goog.global.__render_error = e;
      self._fixupRenderException(e);
      if (e.templateLocation.line) {
        e.message = (
          "template line " + e.templateLocation.line + ": " + e.message
        );
      } else {
        e.message = "in remora template: " + e.message;
      }
      e.message += " (see global __render_error)";
      throw e;
    }

    return context.buffer.join("");
  };

  self.setText(text);
  return self;
};

remora.Template.smartLoad = function(obj, options) {
  if (typeof obj === "string")
    return remora.Template(obj, options);

  if (obj === null || obj === undefined)
    obj = "" + obj;

  // This is how jQuery detects DOM nodes, and it seems reasonable... So I'm
  // going to copy it.
  if (obj.nodeType)
    obj = obj.innerHTML;

  return remora.Template("" + obj, options);
};

(function() {
  var xmlEscapes = {
    "&" : "&amp;",
    ">" : "&gt;", 
    "<" : "&lt;", 
    '"' : "&#34;",
    "'" : "&#39;"
  };
  var xmlEscapeRe = /[&<>'"]/g;

  remora.RenderContext.builtinFilters = {
    u: function(text) {
      return escape(text);
    },
    h: function(text) {
      return text.replace(xmlEscapeRe, function(chr) {
        return xmlEscapes[chr];
      });
    },
    trim: function(text) {
      return text.replace(/^[ \t\n\v]*/, "").replace(/[ \n\t\v]*$/, "");
    }
  };
})();

remora.render = function(text, data, options) {
  return remora.Template.smartLoad(text, options).render(data);
};
(function($) {
if ($ === undefined)
  return;

var remora = goog.global.remora;

var methods = {
  options: function(elem, options) {
    return $.extend({
      data: undefined,
      templateOptions: {},
      tag: "div",
      ignoreAttributes: {
        type: true
      }
    }, options || {});
  },

  template: function(elem, options, _cacheTarget) {
    var template = elem.data("remora:template");
    if (!template) {
      template = remora.Template(elem[0].innerHTML, options.templateOptions);
      (_cacheTarget || elem).data("remora:template", template);
    }
    return template;
  },

  prepare: function(elem, options) {
    var prepared = elem.data("remora:prepared-element");
    if (prepared)
      return prepared;

    var oldElem = elem[0];
    var $oldElem = elem;
    var newElem = document.createElement(options.tag);
    var $newElem = $(newElem);
    for (var i = 0; i < oldElem.attributes.length; i += 1) {
      var attr = oldElem.attributes[i];
      if (options.ignoreAttributes[attr.name])
        continue;
      newElem.attributes.setNamedItemNS(attr.cloneNode(false));
    }
    oldElem.parentNode.replaceChild(newElem, oldElem);
    template = methods.template(elem, options, $newElem);
    $oldElem.data("remora:prepared-element", $newElem);
    $newElem.data("remora:prepared-element", $newElem);
    return $newElem;
  },

  render: function(elem, data, options) {
    options.data = options.data || data;
    elem = methods.prepare(elem, options);
    var template = methods.template(elem, options);
    elem[0].innerHTML = template.render(options.data);
    return elem;
  }
};

$.fn.remora = function(methodName, first, second) {
  if (methodName === "setRemora") {
    remora = first;
    return this;
  }

  var method = methods[methodName];
  if (!method)
    throw Error("Unknown method: " + methodName);

  if (!this.length)
    throw Error("Invalid call (empty selector)");

  switch (methodName) {
    case "render":
      second = methods.options(this, second);
      break;
    case "options":
      /* do nothing */
      break;
    default:
      first = methods.options(this, first);
  }

  return method.apply(null, [this, first, second]);
};

})(goog.global.jQuery);
