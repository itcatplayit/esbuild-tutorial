# Content Types

All of the built-in content types are listed below. Each content type has an associated "loader" which tells esbuild how to interpret the file contents. Some file extensions already have a loader configured for them by default, although the defaults can be overridden.

## JavaScript

Loader: `js`

This loader is enabled by default for `.js`, `.cjs`, and `.mjs` files. The `.cjs` extension is used by node for CommonJS modules and the `.mjs` extension is used by node for ECMAScript modules.

Note that by default, esbuild's output will take advantage of all modern JS features. For example, `a !== void 0 && a !== null ? a : b` will become `a ?? b` when minifying is enabled which makes use of syntax from the [ES2020](https://262.ecma-international.org/11.0/#prod-CoalesceExpression) version of JavaScript. If this is undesired, you must specify esbuild's [target](./api/#target) setting to say in which browsers you need the output to work correctly. Then esbuild will avoid using JavaScript features that are too modern for those browsers.

All modern JavaScript syntax is supported by esbuild. Newer syntax may not be supported by older browsers, however, so you may want to configure the [target](./api/#target) option to tell esbuild to convert newer syntax to older syntax as appropriate.

These syntax features are always transformed for older browsers:

| Syntax transform	|	Language version | Example |
| ---	|	--- | --- |
| [Trailing commas in function parameter lists and calls](https://github.com/tc39/proposal-trailing-function-commas) | `es2017` | `foo(a, b, )` |
| [Numeric separators](https://github.com/tc39/proposal-numeric-separator) | `esnext` | `1_000_000` |

These syntax features are conditionally transformed for older browsers depending on the configured language target:


| Syntax transform	|	Transformed when `--target` is below | Example |
| ---	|	--- | --- |
| [Exponentiation operator](https://github.com/tc39/proposal-exponentiation-operator)	|	`es2016` | `a ** b` |
| [Async functions](https://github.com/tc39/ecmascript-asyncawait) |	`es2017` |	`async () => {}` |
| [Asynchronous iteration](https://github.com/tc39/proposal-async-iteration) |	`es2018` |	`for await (let x of y) {}` |
| [Spread properties](https://github.com/tc39/proposal-object-rest-spread) |	`es2018` |	`let x = {...y}` |
| [Rest properties](https://github.com/tc39/proposal-object-rest-spread) |	`es2018` |	`let {...x} = y` |
| [Optional catch binding](https://github.com/tc39/proposal-optional-catch-binding) |	`es2019` |	`try {} catch {}` |
| [Optional chaining](https://github.com/tc39/proposal-optional-chaining) |	`es2020` |	`a?.b` |
| [Nullish coalescing](https://github.com/tc39/proposal-nullish-coalescing) |	`es2020` |	`a ?? b` |
| [`import.meta`](https://github.com/tc39/proposal-import-meta) |	`es2020` |	`import.meta` |
| [Logical assignment operators](https://github.com/tc39/proposal-logical-assignment) |	`es2021` |	`a ??= b` |
| [Class instance fields](https://github.com/tc39/proposal-class-fields) |	`es2022` |	`class { x }` |
| [Static class fields](https://github.com/tc39/proposal-static-class-features) |	`es2022` |	`class { static x }` |
| [Private instance methods](https://github.com/tc39/proposal-private-methods) |	`es2022` |	`class { #x() {} }` |
| [Private instance fields](https://github.com/tc39/proposal-class-fields) |	`es2022` |	`class { #x }` |
| [Private static methods](https://github.com/tc39/proposal-static-class-features) |	`es2022` |	`class { static #x() {} }` |
| [Private static fields](https://github.com/tc39/proposal-static-class-features) |	`es2022` |	`class { static #x }` |
| [Ergonomic brand checks](https://github.com/tc39/proposal-private-fields-in-in) |	`es2022` |	`#x in y` |
| [Class static blocks](https://github.com/tc39/proposal-class-static-block) |	`es2022` |	`class { static {} }` |
| [Import assertions](https://github.com/tc39/proposal-import-assertions) |	`esnext` |	`import "x" assert {}` |

These syntax features are currently always passed through un-transformed:

| Syntax transform	|	Unsupported when `--target` is below | Example |
| ---	|	--- | --- |
| [Async generators](https://github.com/tc39/proposal-async-iteration)	| `es2018`	| `async function* foo() {}` |
| [BigInt](https://github.com/tc39/proposal-bigint)	| `es2020`	| `123n` |
| [Top-level await](https://github.com/tc39/proposal-top-level-await)	| `es2022`	| `await import(x)` |
| [Arbitrary module namespace identifiers](https://github.com/bmeck/proposal-arbitrary-module-namespace-identifiers)	| `es2022`	| `export {foo as 'f o o'}` |
| [Hashbang grammar](https://github.com/tc39/proposal-hashbang)	| `esnext`	| `#!/usr/bin/env node` |

See also [the list of finished ECMAScript proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) and [the list of active ECMAScript proposals](https://github.com/tc39/proposals/blob/main/README.md). Note that while transforming code containing top-level await is supported, bundling code containing top-level await is only supported when the [output format](./api/#format) is set to [`esm`](./api/#format-esm).

### JavaScript caveats

You should keep the following things in mind when using JavaScript with esbuild:

#### ES5 is not supported well

Transforming ES6+ syntax to ES5 is not supported yet. However, if you're using esbuild to transform ES5 code, you should still set the [target](./api/#target) to `es5`. This prevents esbuild from introducing ES6 syntax into your ES5 code. For example, without this flag the object literal `{x: x}` will become `{x}` and the string `"a\nb"` will become a multi-line template literal when minifying. Both of these substitutions are done because the resulting code is shorter, but the substitutions will not be performed if the [target](./api/#target) is `es5`.

#### Private member performance

The private member transform (for the `#name` syntax) uses `WeakMap` and `WeakSet` to preserve the privacy properties of this feature. This is similar to the corresponding transforms in the Babel and TypeScript compilers. Most modern JavaScript engines (V8, JavaScriptCore, and SpiderMonkey but not ChakraCore) may not have good performance characteristics for large `WeakMap` and `WeakSet` objects.

Creating many instances of classes with private fields or private methods with this syntax transform active may cause a lot of overhead for the garbage collector. This is because modern engines (other than ChakraCore) store weak values in an actual map object instead of as hidden properties on the keys themselves, and large map objects can cause performance issues with garbage collection. See [this reference](https://github.com/tc39/ecma262/issues/1657#issuecomment-518916579) for more information.

#### Imports follow ECMAScript module behavior

You might try to modify global state before importing a module which needs that global state and expect it to work. However, JavaScript (and therefore esbuild) effectively "hoists" all `import` statements to the top of the file, so doing this won't work:

```
window.foo = {}
import './something-that-needs-foo'
```

There are some broken implementations of ECMAScript modules out there (e.g. the TypeScript compiler) that don't follow the JavaScript specification in this regard. Code compiled with these tools may "work" since the `import` is replaced with an inline call to `require()`, which ignores the hoisting requirement. But such code will not work with real ECMAScript module implementations such as node, a browser, or esbuild, so writing code like this is non-portable and is not recommended.

The way to do this correctly is to move the global state modification into its own import. That way it *will* be run before the other import:

```js
import './assign-to-foo-on-window'
import './something-that-needs-foo'
```

#### Avoid direct `eval` when bundling

Although the expression `eval(x)` looks like a normal function call, it actually takes on special behavior in JavaScript. Using `eval` in this way means that the evaluated code stored in x can reference any variable in any containing scope by name. For example, the code `let y = 123; return eval('y')` will return `123`.

This is called "direct eval" and is problematic when bundling your code for many reasons:

- Modern bundlers contain an optimization called "scope hoisting" that merges all bundled files into a single file and renames variables to avoid name collisions. However, this means code evaluated by direct `eval` can read and write variables in any file in the bundle! This is a correctness issue because the evaluated code may try to access a global variable but may accidentally access a private variable with the same name from another file instead. It can potentially even be a security issue if a private variable in another file has sensitive data.

- The evaluated code may not work correctly when it references variables imported using an `import` statement. Imported variables are live bindings to variables in another file. They are not copies of those variables. So when esbuild bundles your code, your imports are replaced with a direct reference to the variable in the imported file. But that variable may have a different name, in which case the code evaluated by direct `eval` will be unable to reference it by the expected name.

- Using direct `eval` forces esbuild to deoptimize all of the code in all of the scopes containing calls to direct `eval`. For correctness, it must assume that the evaluated code might need to access any of the other code in the file reachable from that `eval` call. This means none of that code will be eliminated as dead code and none of that code will be minified.

- Because the code evaluated by the direct `eval` could need to reference any reachable variable by name, esbuild is prevented from renaming all of the variables reachable by the evaluated code. This means it can't rename variables to avoid name collisions with other variables in the bundle. So the direct `eval` causes esbuild to wrap the file in a CommonJS closure, which avoids name collisions by introducing a new scope instead. However, this makes the generated code bigger and slower because exported variables use run-time dynamic binding instead of compile-time static binding.

Luckily it is usually easy to avoid using direct `eval`. There are two commonly-used alternatives that avoid all of the drawbacks mentioned above:

- `(0, eval)('x')`

This is known as "indirect eval" because `eval` is not being called directly, and so does not trigger the grammatical special case for direct eval in the JavaScript VM. You can call indirect eval using any syntax at all except for an expression of the exact form `eval('x')`. For example, `var eval2 = eval; eval2('x')` and `[eval][0]('x')` and `window.eval('x')` are all indirect eval calls. When you use indirect eval, the code is evaluated in the global scope instead of in the inline scope of the caller.

- `new Function('x')`

This constructs a new function object at run-time. It is as if you wrote `function() { x }` in the global scope except that `x` can be an arbitrary string of code. This form is sometimes convenient because you can add arguments to the function, and use those arguments to expose variables to the evaluated code. For example, `(new Function('env', 'x'))(someEnv)` is as if you wrote `(function(env) { x })(someEnv)`. This is often a sufficient alternative for direct eval when the evaluated code needs to access local variables because you can pass the local variables in as arguments.

#### The value of `toString()` is not preserved on functions (and classes)

It's somewhat common to call `toString()` on a JavaScript function object and then pass that string to some form of `eval` to get a new function object. This effectively "rips" the function out of the containing file and breaks links with all variables in that file. Doing this with esbuild is not supported and may not work. In particular, esbuild often uses helper methods to implement certain features and it assumes that JavaScript scope rules have not been tampered with. For example:

```js
let pow = (a, b) => a ** b;
let pow2 = (0, eval)(pow.toString());
console.log(pow2(2, 3));
```

When this code is compiled for ES6, where the `**` operator isn't available, the `**` operator is replaced with a call to the `__pow` helper function:

```js
let __pow = Math.pow;
let pow = (a, b) => __pow(a, b);
let pow2 = (0, eval)(pow.toString());
console.log(pow2(2, 3));
```

If you try to run this code, you'll get an error such as `ReferenceError: __pow is not defined` because the function `(a, b) => __pow(a, b)` depends on the locally-scoped symbol `__pow` which is not available in the global scope. This is the case for many JavaScript language features including `async` functions, as well as some esbuild-specific features such as the [keep names](./api/#keep-names) setting.

This problem most often comes up when people get the source code of a function with `.toString()` and then try to use it as the body of a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). If you are doing this and you want to use esbuild, you should instead build the source code for the web worker in a separate build step and then insert the web worker source code as a string into the code that creates the web worker. The [define](./api/#define) feature is one way to insert the string at build time.

#### The value of `this` is not preserved on functions called from a module namespace object

In JavaScript, the value of `this` in a function is automatically filled in for you based on how the function is called. For example if a function is called using `obj.fn()`, the value of `this` during the function call will be `obj`. This behavior is respected by esbuild with one exception: if you call a function from a module namespace object, the value of this may not be correct. For example, consider this code that calls `foo` from the module namespace object `ns`:

```js
import * as ns from './foo.js'
ns.foo()
```

If `foo.js` tries to reference the module namespace object using `this`, then it won't necessarily work after the code is bundled with esbuild:

```js
// foo.js
export function foo() {
  this.bar()
}
export function bar() {
  console.log('bar')
}
```

The reason for this is that esbuild automatically rewrites code most code that uses module namespace objects to code that imports things directly instead. That means the example code above will be converted to this instead, which removes the `this` context for the function call:

```js
import { foo } from './foo.js'
foo()
```

This transformation dramatically improves [tree shaking](./api/#tree-shaking) (a.k.a. dead code elimination) because it makes it possible for esbuild to understand which exported symbols are unused. It has the drawback that this changes the behavior of code that uses `this` to access the module's exports, but this isn't an issue because no one should ever write bizarre code like this in the first place. If you need to access an exported function from the same file, just call it directly (i.e. `bar()` instead of `this.bar()` in the example above).

#### The `default` export can be error-prone

The ES module format (i.e. ESM) have a special export called `default` that sometimes behaves differently than all other export names. When code in the ESM format that has a `default` export is converted to the CommonJS format, and then that CommonJS code is imported into another module in ESM format, there are two different interpretations of what should happen that are both widely-used (the [Babel](https://babeljs.io/) way and the [Node](https://nodejs.org/) way). This is very unfortunate because it causes endless compatibility headaches, especially since JavaScript libraries are often authored in ESM and published as CommonJS.

When esbuild [bundles](./api/#bundle) code that does this, it has to decide which interpretation to use, and there's no perfect answer. The heuristics that esbuild uses are the same heuristics that [Webpack](https://webpack.js.org/) uses (see below for details). Since Webpack is the most widely-used bundler, this means that esbuild is being the most compatible that it can be with the existing ecosystem regarding this compatibility problem. So the good news is that if you can get code with this problem to work with esbuild, it should also work with Webpack.

Here's an example that demonstrates the problem:

```js
// index.js
import foo from './somelib.js'
console.log(foo)
```

```js
// somelib.js
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = 'foo';
```

And here are the two interpretations, both of which are widely-used:

- **The Babel interpretation**

If the Babel interpretation is used, this code will print `foo`. Their rationale is that `somelib.js` was converted from ESM into CommonJS (as you can tell by the `__esModule` marker) and the original code looked something like this:

```js
// somelib.js
export default 'foo'
```

If `somelib.js` hadn't been converted from ESM into CommonJS, then this code would print `foo`, so it should still print `foo` regardless of the module format. This is accomplished by detecting when a CommonJS module used to be an ES module via the `__esModule` marker (which all module conversion tools set including Babel, TypeScript, Webpack, and esbuild) and setting the default import to `exports.default` if the `__esModule` marker is present. This behavior is important because it's necessary to run cross-compiled ESM correctly in a CommonJS environment, and for a long time that was the only way to run ESM code in Node before Node eventually added native ESM support.

- **The Node interpretation**

If the Node interpretation is used, this code will print `{ default: 'foo' }`. Their rationale is that CommonJS code uses dynamic exports while ESM code uses static exports, so the fully general approach to importing CommonJS into ESM is to expose the CommonJS `exports` object itself somehow. For example, CommonJS code can do `exports[Math.random()] = 'foo'` which has no equivalent in ESM syntax. The `default` export is used for this because that's actually what it was originally designed for by the people who came up with the ES module specification. This interpretation is entirely reasonable for normal CommonJS modules. It only causes compatibility problems for CommonJS modules that used to be ES modules (i.e. when `__esModule` is present) in which case the behavior diverges from the Babel interpretation.

*If you are a library author:* When writing new code, you should strongly consider avoiding the `default` export entirely. It has unfortunately been tainted with compatibility problems and using it will likely cause problems for your users at some point.

*If you are a library user:* By default, esbuild will use the Babel interpretation. If you want esbuild to use the Node interpretation instead, you need to either put your code in a file ending in `.mts` or `.mjs`, or you need to add `"type": "module"` to your `package.json` file. The rationale is that Node's native ESM support can only run ESM code if the file extension is `.mjs` or `"type": "module"` is present, so doing that is a good signal that the code is intended to be run in Node, and should therefore use the Node interpretation of `default` import. This is the same heuristic that Webpack uses.
