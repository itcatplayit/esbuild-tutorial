# API

The API can be accessed in one of three languages: on the command line, in JavaScript, and in Go. The concepts and parameters are largely identical between the three languages so they will be presented together here instead of having separate documentation for each language. You can switch between languages using the `CLI`, `JS`, and `Go` tabs in the top-right corner of each code example. Some specifics for each language:

- **CLI**: If you are using the command-line API, it may be helpful to know that the flags come in one of three forms: `--foo`, `--foo=bar`, or `--foo:bar`. The form `--foo` is used for enabling boolean flags such as [--minify](#minify), the form `--foo=bar` is used for flags that have a single value and are only specified once such as [--platform=](#platform), and the form --foo:bar is used for flags that have multiple values and can be re-specified multiple times such as [--external:](#external).

- **JavaScript**: If you are using JavaScript be sure to check out the [JS-specific details](./official/api#js-details) and [browser](./official/api#browser) sections below. You may also find the [TypeScript type definitions](https://github.com/evanw/esbuild/blob/main/lib/shared/types.ts) for esbuild helpful as a reference.

- **Go**: If you are using Go, you may find the automatically generated Go documentation for esbuild helpful as a reference. There is separate documentation for both of the public Go packages: [`pkg/api`](https://pkg.go.dev/github.com/evanw/esbuild/pkg/api) and [`pkg/cli`](https://pkg.go.dev/github.com/evanw/esbuild/pkg/cli).

## Overview

The two most commonly-used esbuild APIs are [build](./official/api#build) and [transform](./official/api#transform). Each is described below at a high level, followed by documentation for each individual API option.

### Build

This is the primary interface to esbuild. You typically pass one or more [entry point](#entry-points) files to process along with various options, and then esbuild writes the results back out to the file system. Here's a simple example that enables [bundling](#bundle) with an [output directory](#outdir):

::: code-group

```bash [CLI]
esbuild app.ts --bundle --outdir=dist
```

```js {3} [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})
console.log(result)
```

```go {7} [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.ts"},
    Bundle:      true,
    Outdir:      "dist",
  })
  if len(result.Errors) != 0 {
    os.Exit(1)
  }
}
```

:::

Advanced use of the build API involves setting up a long-running build context. This context is an explicit object in JS and Go but is implicit with the CLI. All builds done with a given context share the same build options, and subsequent builds are done incrementally (i.e. they reuse some work from previous builds to improve performance). This is useful for development because esbuild can rebuild your app in the background for you while you work.

There are three different incremental build APIs:

- **[Watch mode](#watch)** tells esbuild to watch the file system and automatically rebuild for you whenever you edit and save a file that could invalidate the build. Here's an example:

::: code-group

```bash {1} [CLI]
$ esbuild app.ts --bundle --outdir=dist --watch
[watch] build finished, watching for changes...
```

```js {7} [JS]
let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})

await ctx.watch()
```

```go {7} [Go]
ctx, err := api.Context(api.BuildOptions{
  EntryPoints: []string{"app.ts"},
  Bundle:      true,
  Outdir:      "dist",
})

err2 := ctx.Watch(api.WatchOptions{})
```

:::

- **[Serve mode](#serve)** starts a local development server that serves the results of the latest build. Incoming requests automatically start new builds so your web app is always up to date when you reload the page in the browser. Here's an example:

::: code-group

```bash {1} [CLI]
$ esbuild app.ts --bundle --outdir=dist --serve

 > Local:   http://127.0.0.1:8000/
 > Network: http://192.168.0.1:8000/

127.0.0.1:61302 - "GET /" 200 [1ms]
```

```js {7} [JS]
let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})

let { host, port } = await ctx.serve()
```

```go {7} [Go]
ctx, err := api.Context(api.BuildOptions{
  EntryPoints: []string{"app.ts"},
  Bundle:      true,
  Outdir:      "dist",
})

server, err2 := ctx.Serve(api.ServeOptions{})
```

:::

- **[Rebuild mode](#rebuild)** lets you manually invoke a build. This is useful when integrating esbuild with other tools (e.g. using a custom file watcher or development server instead of esbuild's built-in ones). Here's an example:

::: code-group

```bash [CLI]
# The CLI does not have an API for "rebuild"
```

```js {8} [JS]
let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})

for (let i = 0; i < 5; i++) {
  let result = await ctx.rebuild()
}
```

```go {8} [Go]
ctx, err := api.Context(api.BuildOptions{
  EntryPoints: []string{"app.ts"},
  Bundle:      true,
  Outdir:      "dist",
})

for i := 0; i < 5; i++ {
  result := ctx.Rebuild()
}
```

:::

These three incremental build APIs can be combined. To enable [live reloading](#live-reload) (automatically reloading the page when you edit and save a file) you'll need to enable [watch](#watch) and [serve](#serve) together on the same context.

When you are done with a context object, you can call `dispose()` on the context to wait for existing builds to finish, stop watch and/or serve mode, and free up resources.

The build and context APIs both take the following options:

<div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
  <div style="width:200px">
    <p style="font-weight:bold;">General options:</p>
    <ul>
      <li><a href="#bundle">Bundle</a></li>
      <li><a href="#cancel">Cancel</a></li>
      <li><a href="#live-reload">Live reload</a></li>
      <li><a href="#platform">Platform</a></li>
      <li><a href="#rebuild">Rebuild</a></li>
      <li><a href="#serve">Serve</a></li>
      <li><a href="#tsconfig">Tsconfig</a></li>
      <li><a href="#watch">Watch</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Input:</p>
    <ul>
      <li><a href="#entry-points">Entry points</a></li>
      <li><a href="#loader">Loader</a></li>
      <li><a href="#stdin">Stdin</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Output contents:</p>
    <ul>
      <li><a href="#banner">Banner</a></li>
      <li><a href="#charset">Charset</a></li>
      <li><a href="#footer">Footer</a></li>
      <li><a href="#format">Format</a></li>
      <li><a href="#global-name">Global name</a></li>
      <li><a href="#legal-comments">Legal comments</a></li>
      <li><a href="#splitting">Splitting</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Output location:</p>
    <ul>
      <li><a href="#allow-overwrite">Allow overwrite</a></li>
      <li><a href="#asset-names">Asset names</a></li>
      <li><a href="#chunk-names">Chunk names</a></li>
      <li><a href="#entry-names">Entry names</a></li>
      <li><a href="#out-extension">Out extension</a></li>
      <li><a href="#outbase">Outbase</a></li>
      <li><a href="#outdir">Outdir</a></li>
      <li><a href="#outfile">Outfile</a></li>
      <li><a href="#public-path">Public path</a></li>
      <li><a href="#write">Write</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Path resolution:</p>
    <ul>
      <li><a href="#alias">Alias</a></li>
      <li><a href="#conditions">Conditions</a></li>
      <li><a href="#external">External</a></li>
      <li><a href="#main-fields">Main fields</a></li>
      <li><a href="#node-paths">Node paths</a></li>
      <li><a href="#packages">Packages</a></li>
      <li><a href="#preserve-symlinks">Preserve symlinks</a></li>
      <li><a href="#resolve-extensions">Resolve extensions</a></li>
      <li><a href="#working-directory">Working directory</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Transformation:</p>
    <ul>
      <li><a href="#jsx">JSX</a></li>
      <li><a href="#jsx-dev">JSX dev</a></li>
      <li><a href="#jsx-factory">JSX factory</a></li>
      <li><a href="#jsx-fragment">JSX fragment</a></li>
      <li><a href="#jsx-import-source">JSX import source</a></li>
      <li><a href="#jsx-side-effects">JSX side effects</a></li>
      <li><a href="#supported">Supported</a></li>
      <li><a href="#target">Target</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Optimization:</p>
    <ul>
      <li><a href="#define">Define</a></li>
      <li><a href="#drop">Drop</a></li>
      <li><a href="#ignore-annotations">Ignore annotations</a></li>
      <li><a href="#inject">Inject</a></li>
      <li><a href="#keep-names">Keep names</a></li>
      <li><a href="#mangle-props">Mangle props</a></li>
      <li><a href="#minify">Minify</a></li>
      <li><a href="#pure">Pure</a></li>
      <li><a href="#tree-shaking">Tree shaking</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Source maps:</p>
    <ul>
      <li><a href="#source-root">Source root</a></li>
      <li><a href="#sourcefile">Sourcefile</a></li>
      <li><a href="#sourcemap">Sourcemap</a></li>
      <li><a href="#sources-content">Sources content</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Build metadata:</p>
    <ul>
      <li><a href="#analyze">Analyze</a></li>
      <li><a href="#metafile">Metafile</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Logging:</p>
    <ul>
      <li><a href="#color">Color</a></li>
      <li><a href="#format-messages">Format messages</a></li>
      <li><a href="#log-level">Log level</a></li>
      <li><a href="#log-limit">Log limit</a></li>
      <li><a href="#log-override">Log override</a></li>
    </ul>
  </div>
</div>

### Transform

This is a limited special-case of [build](#build) that transforms a string of code representing an in-memory file in an isolated environment that's completely disconnected from any other files. Common uses include minifying code and transforming TypeScript into JavaScript. Here's an example:

::: code-group

```bash {1} [CLI]
$ echo 'let x: number = 1' | esbuild --loader=ts
let x = 1;
```

```js {4} [JS]
import * as esbuild from 'esbuild'

let ts = 'let x: number = 1'
let result = await esbuild.transform(ts, {
  loader: 'ts',
})
console.log(result)
```

```go {8} [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  ts := "let x: number = 1"
  result := api.Transform(ts, api.TransformOptions{
    Loader: api.LoaderTS,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

Taking a string instead of a file as input is more ergonomic for certain use cases. File system isolation has certain advantages (e.g. works in the browser, not affected by nearby `package.json` files) and certain disadvantages (e.g. can't be used with [bundling](#bundle) or [plugins](./offficial/plugins)). If your use case doesn't fit the transform API then you should use the more general [build](#build) API instead.

The transform API takes the following options:


<div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
  <div style="width:200px">
    <p style="font-weight:bold;">General options:</p>
    <ul>
      <li><a href="#platform">Platform</a></li>
      <li><a href="#tsconfig-raw">Tsconfig raw</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Input:</p>
    <ul>
      <li><a href="#loader">Loader</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Output contents:</p>
    <ul>
      <li><a href="#banner">Banner</a></li>
      <li><a href="#charset">Charset</a></li>
      <li><a href="#footer">Footer</a></li>
      <li><a href="#format">Format</a></li>
      <li><a href="#global-name">Global name</a></li>
      <li><a href="#legal-comments">Legal comments</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Transformation:</p>
    <ul>
      <li><a href="#jsx">JSX</a></li>
      <li><a href="#jsx-dev">JSX dev</a></li>
      <li><a href="#jsx-factory">JSX factory</a></li>
      <li><a href="#jsx-fragment">JSX fragment</a></li>
      <li><a href="#jsx-import-source">JSX import source</a></li>
      <li><a href="#jsx-side-effects">JSX side effects</a></li>
      <li><a href="#supported">Supported</a></li>
      <li><a href="#target">Target</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Optimization:</p>
    <ul>
      <li><a href="#define">Define</a></li>
      <li><a href="#drop">Drop</a></li>
      <li><a href="#ignore-annotations">Ignore annotations</a></li>
      <li><a href="#keep-names">Keep names</a></li>
      <li><a href="#mangle-props">Mangle props</a></li>
      <li><a href="#minify">Minify</a></li>
      <li><a href="#pure">Pure</a></li>
      <li><a href="#tree-shaking">Tree shaking</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Source maps:</p>
    <ul>
      <li><a href="#source-root">Source root</a></li>
      <li><a href="#sourcefile">Sourcefile</a></li>
      <li><a href="#sourcemap">Sourcemap</a></li>
      <li><a href="#sources-content">Sources content</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Logging:</p>
    <ul>
      <li><a href="#color">Color</a></li>
      <li><a href="#format-messages">Format messages</a></li>
      <li><a href="#log-level">Log level</a></li>
      <li><a href="#log-limit">Log limit</a></li>
      <li><a href="#log-override">Log override</a></li>
    </ul>
  </div>
</div>

### JS-specific details

The JS API for esbuild comes in both asynchronous and synchronous flavors. The [asynchronous API](#js-async) is recommended because it works in all environments and it's faster and more powerful. The [synchronous API](#js-sync) only works in node and can only do certain things, but it's sometimes necessary in certain node-specific situations. In detail:

#### Async API

Asynchronous API calls return their results using a promise. Note that you'll likely have to use the `.mjs` file extension in node due to the use of the `import` and top-level `await` keywords:

```js
import * as esbuild from 'esbuild'

let result1 = await esbuild.transform(code, options)
let result2 = await esbuild.build(options)
```

Pros:

- You can use [plugins](./official/plugins) with the asynchronous API
- The current thread is not blocked so you can perform other work in the meantime
- You can run many simultaneous esbuild API calls concurrently which are then spread across all available CPUs for maximum performance

Cons:

- Using promises can result in messier code, especially in CommonJS where [top-level await](https://v8.dev/features/top-level-await) is not available
- Doesn't work in situations that must be synchronous such as within [`require.extensions`](https://nodejs.org/api/modules.html#requireextensions)

#### Sync API

Synchronous API calls return their results inline:

```js
let esbuild = require('esbuild')

let result1 = esbuild.transformSync(code, options)
let result2 = esbuild.buildSync(options)
```

Pros:

- Avoiding promises can result in cleaner code, especially when [top-level await](https://v8.dev/features/top-level-await) is not available
- Works in situations that must be synchronous such as within [`require.extensions`](https://nodejs.org/api/modules.html#requireextensions)

Cons:

- You can't use [plugins](./official/plugins) with the synchronous API since plugins are asynchronous
- It blocks the current thread so you can't perform other work in the meantime
- Using the synchronous API prevents esbuild from parallelizing esbuild API calls

### In the browser

The esbuild API can also run in the browser using WebAssembly in a Web Worker. To take advantage of this you will need to install the `esbuild-wasm` package instead of the `esbuild` package:

```bash
npm install esbuild-wasm
```

The API for the browser is similar to the API for node except that you need to call `initialize()` first, and you need to pass the URL of the WebAssembly binary. The synchronous versions of the API are also not available. Assuming you are using a bundler, that would look something like this:

```js
import * as esbuild from 'esbuild-wasm'

await esbuild.initialize({
  wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
})

let result1 = await esbuild.transform(code, options)
let result2 = esbuild.build(options)
```

If you're already running this code from a worker and don't want `initialize` to create another worker, you can pass `worker: false` to it. Then it will create a WebAssembly module in the same thread as the thread that calls `initialize`.

You can also use esbuild's API as a script tag in a HTML file without needing to use a bundler by loading the `lib/browser.min.js` file with a `<script>` tag. In this case the API creates a global called esbuild that holds the API object:

```html
<script src="./node_modules/esbuild-wasm/lib/browser.min.js"></script>
<script>
  esbuild.initialize({
    wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
  }).then(() => {
    ...
  })
</script>
```

If you want to use this API with ECMAScript modules, you should import the `esm/browser.min.js` file instead:

```html
<script type="module">
  import * as esbuild from './node_modules/esbuild-wasm/esm/browser.min.js'

  await esbuild.initialize({
    wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
  })

  ...
</script>
```

## General options

### Bundle

> Supported by: Build

To bundle a file means to inline any imported dependencies into the file itself. This process is recursive so dependencies of dependencies (and so on) will also be inlined. By default esbuild will not bundle the input files. Bundling must be explicitly enabled like this:

::: code-group

```bash [CLI]
esbuild in.js --bundle
```

```js [JS]
import * as esbuild from 'esbuild'

console.log(await esbuild.build({
  entryPoints: ['in.js'],
  bundle: true,
  outfile: 'out.js',
}))
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"in.js"},
    Bundle:      true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Refer to the [getting started guide](.official/getting-started/#your-first-bundle) for an example of bundling with real-world code.

Note that bundling is different than file concatenation. Passing esbuild multiple input files with bundling enabled will create multiple separate bundles instead of joining the input files together. To join a set of files together with esbuild, import them all into a single entry point file and bundle just that one file with esbuild.

### Non-analyzable imports

Bundling with esbuild only works with statically-defined imports (i.e. when the import path is a string literal). Imports that are defined at run-time (i.e. imports that depend on run-time code evaluation) are not bundled, since bundling is a compile-time operation. For example:

```js
// Analyzable imports (will be bundled by esbuild)
import 'pkg';
import('pkg');
require('pkg');

// Non-analyzable imports (will not be bundled by esbuild)
import(`pkg/${foo}`);
require(`pkg/${foo}`);
['pkg'].map(require);
```

The way to work around this issue is to mark the package containing this problematic code as [external](#external) so that it's not included in the bundle. You will then need to ensure that a copy of the external package is available to your bundled code at run-time.

Some bundlers such as [Webpack](https://webpack.js.org/) try to support this by including all potentially-reachable files in the bundle and then emulating a file system at run-time. However, run-time file system emulation is out of scope and will not be implemented in esbuild. If you really need to bundle code that does this, you will likely need to use another bundler instead of esbuild.

### Non-analyzable imports

> Supported by: [Build](#build)

If you are using [rebuild](#rebuild) to manually invoke incremental builds, you may want to use this cancel API to end the current build early so that you can start a new one. You can do that like this:

:::code-group

```bash [CLI]
# The CLI does not have an API for "cancel"
```

```js [JS]
import * as esbuild from 'esbuild'
import process from 'node:process'

let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'www',
  logLevel: 'info',
})

// Whenever we get some data over stdin
process.stdin.on('data', async () => {
  try {
    // Cancel the already-running build
    await ctx.cancel()

    // Then start a new build
    console.log('build:', await ctx.rebuild())
  } catch (err) {
    console.error(err)
  }
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  ctx, err := api.Context(api.BuildOptions{
    EntryPoints: []string{"app.ts"},
    Bundle:      true,
    Outdir:      "www",
    LogLevel:    api.LogLevelInfo,
  })
  if err != nil {
    os.Exit(1)
  }

  // Whenever we get some data over stdin
  buf := make([]byte, 100)
  for {
    if n, err := os.Stdin.Read(buf); err != nil || n == 0 {
      break
    }
    go func() {
      // Cancel the already-running build
      ctx.Cancel()

      // Then start a new build
      result := ctx.Rebuild()
      fmt.Fprintf(os.Stderr, "build: %v\n", result)
    }()
  }
}
````

:::

Make sure to wait until the cancel operation is done before starting a new build (i.e. `await` the returned promise when using JavaScript), otherwise the next [rebuild](#rebuild) will give you the just-canceled build that still hasn't ended yet. Note that plugin [on-end callbacks](./official/plugins#on-end) will still be run regardless of whether or not the build was canceled.

### Live reload

> Supported by: [Build](#build)

Live reload is an approach to development where you have your browser open and visible at the same time as your code editor. When you edit and save your source code, the browser automatically reloads and the reloaded version of the app contains your changes. This means you can iterate faster because you don't have to manually switch to your browser, reload, and then switch back to your code editor after every change. It's very helpful when changing CSS, for example.

There is no esbuild API for live reloading directly. Instead, you can construct live reloading by combining [watch mode](#watch) (to automatically start a build when you edit and save a file) and [serve mode](#serve) (to serve the latest build, but block until it's done) plus a small bit of client-side JavaScript code that you add to your app only during development.

The first step is to enable [watch](#watch) and [serve](#serve) together:

:::code-group

```bash [CLI]
esbuild app.ts --bundle --outdir=www --watch --servedir=www
```

```js [JS]
import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'www',
})

await ctx.watch()

let { host, port } = await ctx.serve({
  servedir: 'www',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  ctx, err := api.Context(api.BuildOptions{
    EntryPoints: []string{"app.ts"},
    Bundle:      true,
    Outdir:      "www",
  })
  if err != nil {
    os.Exit(1)
  }

  err2 := ctx.Watch(api.WatchOptions{})
  if err2 != nil {
    os.Exit(1)
  }

  result, err3 := ctx.Serve(api.ServeOptions{
    Servedir: "www",
  })
  if err3 != nil {
    os.Exit(1)
  }
}
```

:::

The second step is to add some code to your JavaScript that subscribes to the `/esbuild` [server-sent event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) source. When you get the `change` event, you can reload the page to get the latest version of the app. You can do this in a single line of code:

```js
new EventSource('/esbuild').addEventListener('change', () => location.reload())
```

That's it! If you load your app in the browser, the page should now automatically reload when you edit and save a file (assuming there are no build errors).

This should only be included during development, and should not be included in production. One way to remove this code in production is to guard it with an if statement such as `if (!window.IS_PRODUCTION)` and then use [define](#define) to set `window.IS_PRODUCTION` to `true` in production.

#### Live reload caveats

Implementing live reloading like this has a few known caveats:

- These events only trigger when esbuild's output changes. They do not trigger when files unrelated to the build being watched are changed. If your HTML file references other files that esbuild doesn't know about and those files are changed, you can either manually reload the page or you can implement your own live reloading infrastructure instead of using esbuild's built-in behavior.

- The `EventSource` API is supposed to automatically reconnect for you. However, there's [a bug in Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1809332) that breaks this if the server is ever temporarily unreachable. Workarounds are to use any other browser, to manually reload the page if this happens, or to write more complicated code that manually closes and re-creates the `EventSource` object if there is a connection error.

- Browser vendors have decided to not implement HTTP/2 without TLS. This means that when using the `http://` protocol, each `/esbuild` event source will take up one of your precious 6 simultaneous per-domain HTTP/1.1 connections. So if you open more than six HTTP tabs that use this live-reloading technique, you will be unable to use live reloading in some of those tabs (and other things will likely also break). The workaround is to [enable the `https://` protocol](https://esbuild.github.io/api/#https).

#### Hot-reloading for CSS

The `change` event also contains additional information to enable more advanced use cases. It currently contains the `added`, `removed`, and `updated` arrays with the paths of the files that have changed since the previous build, which can be described by the following TypeScript interface:

```ts
interface ChangeEvent {
  added: string[]
  removed: string[]
  updated: string[]
}
```

The code sample below enables "hot reloading" for CSS, which is when the CSS is automatically updated in place without reloading the page. If an event arrives that isn't CSS-related, then the whole page will be reloaded as a fallback:

```js
new EventSource('/esbuild').addEventListener('change', e => {
  const { added, removed, updated } = JSON.parse(e.data)

  if (!added.length && !removed.length && updated.length === 1) {
    for (const link of document.getElementsByTagName("link")) {
      const url = new URL(link.href)

      if (url.host === location.host && url.pathname === updated[0]) {
        const next = link.cloneNode()
        next.href = updated[0] + '?' + Math.random().toString(36).slice(2)
        next.onload = () => link.remove()
        link.parentNode.insertBefore(next, link.nextSibling)
        return
      }
    }
  }

  location.reload()
})
```

#### Hot-reloading for JavaScript

Hot-reloading for JavaScript is not currently implemented by esbuild. It's possible to transparently implement hot-reloading for CSS because CSS is stateless, but JavaScript is stateful so you cannot transparently implement hot-reloading for JavaScript like you can for CSS.

Some other development servers implement hot-reloading for JavaScript anyway, but it requires additional APIs, sometimes requires framework-specific hacks, and sometimes introduces transient state-related bugs during an editing session. Doing this is outside of esbuild's scope. You are welcome to use other tools instead of esbuild if hot-reloading for JavaScript is one of your requirements.

However, with esbuild's live-reloading you can persist your app's current JavaScript state in [`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) to more easily restore your app's JavaScript state after a page reload. If your app loads quickly (which it already should for your users' sake), live-reloading with JavaScript can be almost as fast as hot-reloading with JavaScript would be.

### Platform

> Supported by: [Build](./official/api#build) and [Transform](./official/api#transform)

By default, esbuild's bundler is configured to generate code intended for the browser. If your bundled code is intended to run in node instead, you should set the platform to `node`:

::: code-group

```bash [CLI]
esbuild app.js --bundle --platform=node
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  platform: 'node',
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Bundle:      true,
    Platform:    api.PlatformNode,
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

When the platform is set to `browser` (the default value):

- When [bundling](./official/api#bundle) is enabled the default output [format](./official/api#format) is set to `iife`, which wraps the generated JavaScript code in an immediately-invoked function expression to prevent variables from leaking into the global scope.

- If a package specifies a map for the [`browser`](https://gist.github.com/defunctzombie/4339901/49493836fb873ddaa4b8a7aa0ef2352119f69211) field in its `package.json` file, esbuild will use that map to replace specific files or modules with their browser-friendly versions. For example, a package might contain a substitution of [`path`](https://nodejs.org/api/path.html) with [`path-browserify`](https://www.npmjs.com/package/path-browserify).

- The [main fields](./official/api#main-fields) setting is set to `browser,module,main` but with some additional special behavior: if a package provides `module` and `main` entry points but not a `browser` entry point then `main` is used instead of `module` if that package is ever imported using `require()`. This behavior improves compatibility with CommonJS modules that export a function by assigning it to `module.exports`. If you want to disable this additional special behavior, you can explicitly set the [main fields](./official/api#main-fields) setting to `browser,module,main`.

- The [conditions](./official/api#conditions) setting automatically includes the `browser` condition. This changes how the `exports` field in `package.json` files is interpreted to prefer browser-specific code.

- If no custom [conditions](./official/api#conditions) are configured, the Webpack-specific `module` condition is also included. The `module` condition is used by package authors to provide a tree-shakable ESM alternative to a CommonJS file without creating a [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard). You can prevent the `module` condition from being included by explicitly configuring some custom conditions (even an empty list).

- When using the [build](./official/api#build) API, all `process.env.NODE_ENV` expressions are automatically [defined](./official/api#define) to `"production"` if all [minification](./official/api#minify) options are enabled and `"development"` otherwise. This only happens if `process`, `process.env`, and `process.env.NODE_ENV` are not already defined. This substitution is necessary to avoid React-based code crashing instantly (since `process` is a node API, not a web API).

- The character sequence `</script>` will be escaped in JavaScript code and the character sequence `</style>` will be escaped in CSS code. This is done in case you inline esbuild's output directly into an HTML file. This can be disabled with esbuild's [supported](./official/api#supported) feature by `setting inline-script` (for JavaScript) and/or `inline-style` (for CSS) to `false`.

When the platform is set to `node`:

- When [bundling](./official/api#bundle) is enabled the default output [format](./official/api#format) is set to `cjs`, which stands for CommonJS (the module format used by node). ES6-style exports using `export` statements will be converted into getters on the CommonJS `exports` object.

- All [built-in node modules](https://nodejs.org/docs/latest/api/) such as `fs` are automatically marked as [external](./official/api#external) so they don't cause errors when the bundler tries to bundle them.

- The [main fields](./official/api#main-fields) setting is set to `main,module`. This means tree shaking will likely not happen for packages that provide both `module` and `main` since tree shaking works with ECMAScript modules but not with CommonJS modules.

  Unfortunately some packages incorrectly treat `module` as meaning "browser code" instead of "ECMAScript module code" so this default behavior is required for compatibility. You can manually configure the [main fields](./official/api#main-fields) setting to `module,main` if you want to enable tree shaking and know it is safe to do so.

- The [conditions](./official/api#conditions) setting automatically includes the `node` condition. This changes how the `exports` field in `package.json` files is interpreted to prefer node-specific code.

- If no custom [conditions](./official/api#conditions) are configured, the Webpack-specific `module` condition is also included. The `module` condition is used by package authors to provide a tree-shakable ESM alternative to a CommonJS file without creating a [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard). You can prevent the `module` condition from being included by explicitly configuring some custom conditions (even an empty list).

- When the [format](./official/api#format) is set to `cjs` but the entry point is ESM, esbuild will add special annotations for any named exports to enable importing those named exports using ESM syntax from the resulting CommonJS file. Node's documentation has more information about [node's detection of CommonJS named exports](https://nodejs.org/api/esm.html#commonjs-namespaces).

- The [`binary`](.official/content-types/#binary) loader will make use of node's built-in [`Buffer.from`](https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding) API to decode the base64 data embedded in the bundle into a `Uint8Array`. This is faster than what esbuild can do otherwise since it's implemented by node in native code.

When the platform is set to `neutral`:

- When [bundling](./official/api#bundle) is enabled the default output [format](./official/api#format) is set to `esm`, which uses the `export` syntax introduced with ECMAScript 2015 (i.e. ES6). You can change the output format if this default is not appropriate.

- The [main fields](./official/api#main-fields) setting is empty by default. If you want to use npm-style packages, you will likely have to configure this to be something else such as main for the standard `main` field used by node.

- The [conditions](./official/api#conditions) setting does not automatically include any platform-specific values.

See also [bundling for the browser](./official/getting-started/#bundling-for-the-browser) and [bundling for node](./official/getting-started/#bundling-for-node).

### Rebuild

> Supported by: [Build]()

You may want to use this API if your use case involves calling esbuild's [build]() API repeatedly with the same options. For example, this is useful if you are implementing your own file watcher service. Rebuilding is more efficient than building again because some of the data from the previous build is cached and can be reused if the original files haven't changed since the previous build. There are currently two forms of caching used by the rebuild API:

Files are stored in memory and are not re-read from the file system if the file metadata hasn't changed since the last build. This optimization only applies to file system paths. It does not apply to virtual modules created by [plugins]().

Parsed [ASTs]() are stored in memory and re-parsing the AST is avoided if the file contents haven't changed since the last build. This optimization applies to virtual modules created by plugins in addition to file system modules, as long as the virtual module path remains the same.

Here's how to do a rebuild: {.ignore-linkage}

::: code-group {.ignore-linkage}

```bash [CLI]
# The CLI does not have an API for "rebuild"
```

```js [JS]
import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['app.js'],
  bundle: true,
  outfile: 'out.js',
})

// Call "rebuild" as many times as you want
for (let i = 0; i < 5; i++) {
  let result = await ctx.rebuild()
}

// Call "dispose" when you're done to free up resources
ctx.dispose()
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  ctx, err := api.Context(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Bundle:      true,
    Outfile:     "out.js",
  })
  if err != nil {
    os.Exit(1)
  }

  // Call "Rebuild" as many times as you want
  for i := 0; i < 5; i++ {
    result := ctx.Rebuild()
    if len(result.Errors) > 0 {
      os.Exit(1)
    }
  }

  // Call "Dispose" when you're done to free up resources
  ctx.Dispose()
}
```

:::

### Serve

> Supported by: [Build](./official/api#build)

::: info

If you want your app to automatically reload as you edit, you should read about [live reloading](./official/api#live-reload). It combines serve mode with [watch mode](./official/api#watch) to listen for changes to the file system.

:::

Serve mode starts a web server that serves your code to your browser on your device. Here's an example that bundles `src/app.ts` into `www/js/app.js` and then also serves the www directory over `http://localhost:8000/`:

::: code-group

```bash [CLI]
esbuild src/app.ts --outdir=www/js --bundle --servedir=www
```

```js [JS]
import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['src/app.ts'],
  outdir: 'www/js',
  bundle: true,
})

let { host, port } = await ctx.serve({
  servedir: 'www',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  ctx, err := api.Context(api.BuildOptions{
    EntryPoints: []string{"src/app.ts"},
    Outdir:     "www/js",
    Bundle:      true,
  })
  if err != nil {
    os.Exit(1)
  }

  server, err2 := ctx.Serve(api.ServeOptions{
    Servedir: "www",
  })
  if err2 != nil {
    os.Exit(1)
  }

  // Returning from main() exits immediately in Go.
  // Block forever so we keep serving and don't exit.
  <-make(chan struct{})
}
```

:::

If you create the file `www/index.html` with the following contents, the code contained in `src/app.ts` will load when you navigate to `http://localhost:8000/`:

```html
<script src="js/app.js"></script>
```

One benefit of using esbuild's built-in web server instead of another web server is that whenever you reload, the files that esbuild serves are always up to date. That's not necessarily the case with other development setups. One common setup is to run a local file watcher that rebuilds output files whenever their input files change, and then separately to run a local file server to serve those output files. But that means reloading after an edit may reload the old output files if the rebuild hasn't finished yet. With esbuild's web server, each incoming request starts a rebuild if one is not already in progress, and then waits for the current rebuild to complete before serving the file. This means esbuild never serves stale build results.

Note that this web server is intended to only be used in development. *Do not use this in production*.

#### Arguments

The arguments to the serve API are as follows:

::: code-group

```bash [CLI]
# Enable serve mode
--serve

# Set the port
--serve=9000

# Set the host and port (IPv4)
--serve=127.0.0.1:9000

# Set the host and port (IPv6)
--serve=[::1]:9000

# Set the directory to serve
--servedir=www

# Enable HTTPS
--keyfile=your.key --certfile=your.cert
```

```bash [JS]
interface ServeOptions {
  port?: number
  host?: string
  servedir?: string
  keyfile?: string
  certfile?: string
  onRequest?: (args: ServeOnRequestArgs) => void
}

interface ServeOnRequestArgs {
  remoteAddress: string
  method: string
  path: string
  status: number
  timeInMS: number
}
```

```go [Go]
type ServeOptions struct {
  Port      uint16
  Host      string
  Servedir  string
  Keyfile   string
  Certfile  string
  OnRequest func(ServeOnRequestArgs)
}

type ServeOnRequestArgs struct {
  RemoteAddress string
  Method        string
  Path          string
  Status        int
  TimeInMS      int
}
```

:::

- `host`

By default, esbuild makes the web server available on all IPv4 network interfaces. This corresponds to a host address of `0.0.0.0`. If you would like to configure a different host (for example, to only serve on the `127.0.0.1` loopback interface without exposing anything to the network), you can specify the host using this argument.

If you need to use IPv6 instead of IPv4, you just need to specify an IPv6 host address. The equivalent to the `127.0.0.1` loopback interface in IPv6 is `::1` and the equivalent to the `0.0.0.0` universal interface in IPv6 is `::`.

- `port`

The HTTP port can optionally be configured here. If omitted, it will default to an open port with a preference for ports in the range 8000 to 8009.

- `servedir`

This is a directory of extra content for esbuild's HTTP server to serve instead of a 404 when incoming requests don't match any of the generated output file paths. This lets you use esbuild as a general-purpose local web server.

For example, you might want to create an `index.html` file and then set `servedir` to `"."` to serve the current directory (which includes the `index.html` file). If you don't set `servedir` then esbuild will only serve the build results, but not any other files.

- `keyfile` and `certfile`

If you pass a private key and certificate to esbuild using `keyfile` and `certfile`, then esbuild's web server will use the `https://` protocol instead of the `http://` protocol. See [enabling HTTPS](./official/api#https) for more information.

- `onRequest`

This is called once for each incoming request with some information about the request. This callback is used by the CLI to print out a log message for each request. The time field is the time to generate the data for the request, but it does not include the time to stream the request to the client.

Note that this is called after the request has completed. It's not possible to use this callback to modify the request in any way. If you want to do this, you should [put a proxy in front of esbuild](./official/api#serve-proxy) instead.

#### Return values

::: code-group

```bash [CLI]
# The CLI will print the host and port like this:

 > Local: http://127.0.0.1:8000/
```

```js [JS]
interface ServeResult {
  host: string
  port: number
}
```

```go [Go]
type ServeResult struct {
  Host string
  Port uint16
}
```

- `host`

This is the host that ended up being used by the web server. It will be `0.0.0.0` (i.e. serving on all available network interfaces) unless a custom host was configured. If you are using the CLI and the host is `0.0.0.0`, all available network interfaces will be printed as hosts instead.

- `port`

This is the port that ended up being used by the web server. You'll want to use this if you don't specify a port since esbuild will end up picking an arbitrary open port, and you need to know which port it picked to be able to connect to it.

:::

#### Enabling HTTPS

By default, esbuild's web server uses the `http://` protocol. However, certain modern web features are unavailable to HTTP websites. If you want to use these features, then you'll need to tell esbuild to use the `https://` protocol instead.

To enable HTTPS with esbuild:

1. Generate a self-signed certificate. There are many ways to do this. Here's one way, assuming you have the `openssl` command installed:

```bash
openssl req -x509 -newkey rsa:4096 -keyout your.key -out your.cert -days 9999 -nodes -subj /CN=127.0.0.1
```

2. Pass `your.key` and `your.cert` to esbuild using the `keyfile` and `certfile` [serve arguments](./official/api/#serve-arguments).

3. Click past the scary warning in your browser when you load your page (self-signed certificates aren't secure, but that doesn't matter since we're just doing local development).

If you have more complex needs than this, you can still [put a proxy in front of esbuild](./official/api/#serve-proxy) and use that for HTTPS instead. Note that if you see the message `Client sent an HTTP request to an HTTPS server` when you load your page, then you are using the incorrect protocol. Replace `http://` with `https://` in your browser's URL bar.

Keep in mind that esbuild's HTTPS support has nothing to do with security. The only reason to enable HTTPS in esbuild is because browsers have made it impossible to do local development with certain modern web features without jumping through these extra hoops. *Please do not use esbuild's development server for anything that needs to be secure*. It's only intended for local development and no considerations have been made for production environments whatsoever.

#### Customizing server behavior

It's not possible to hook into esbuild's local server to customize the behavior of the server itself. Instead, behavior should be customized by putting a proxy in front of esbuild.

Here's a simple example of a proxy server to get you started, using node's built-in [http](https://nodejs.org/api/http.html) module. It adds a custom 404 page instead of esbuild's default 404 page:

```js
import * as esbuild from 'esbuild'
import http from 'node:http'

// Start esbuild's server on a random local port
let ctx = await esbuild.context({
  // ... your build options go here ...
})

// The return value tells us where esbuild's local server is
let { host, port } = await ctx.serve({ servedir: '.' })

// Then start a proxy server on port 3000
http.createServer((req, res) => {
  const options = {
    hostname: host,
    port: port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }

  // Forward each incoming request to esbuild
  const proxyReq = http.request(options, proxyRes => {
    // If esbuild returns "not found", send a custom 404 page
    if (proxyRes.statusCode === 404) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>A custom 404 page</h1>')
      return
    }

    // Otherwise, forward the response from esbuild to the client
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })

  // Forward the body of the request to esbuild
  req.pipe(proxyReq, { end: true })
}).listen(3000)
```

This code starts esbuild's server on random local port and then starts a proxy server on port 3000. During development you would load [http://localhost:3000](http://localhost:3000/) in your browser, which talks to the proxy. This example demonstrates modifying a response after esbuild has handled the request, but you can also modify or replace the request before esbuild has handled it.

You can do many things with a proxy like this including:

- Injecting your own 404 page (the example above)
- Customizing the mapping of routes to files on the file system
- Redirecting some routes to an API server instead of to esbuild

You can also use a real proxy such as [nginx](https://nginx.org/en/docs/beginners_guide.html#proxy) if you have more advanced needs.

### Tsconfig

> Supported by: [Build](./official/api/#build)

Normally the [build](./official/api/#build) API automatically discovers `tsconfig.json` files and reads their contents during a build. However, you can also configure a custom `tsconfig.json` file to use instead. This can be useful if you need to do multiple builds of the same code with different settings:

::: code-group

```bash [CLI]
esbuild app.ts --bundle --tsconfig=custom-tsconfig.json
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.ts'],
  bundle: true,
  tsconfig: 'custom-tsconfig.json',
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.ts"},
    Bundle:      true,
    Tsconfig:    "custom-tsconfig.json",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Tsconfig raw

> Supported by: [Transform](./official/api/#transform)

This option can be used to pass your `tsconfig.json` file to the [transform](./official/api/#transform) API, which doesn't access the file system. Using it looks like this:

::: code-group

```bash [CLI]
echo 'class Foo { foo }' | esbuild --loader=ts --tsconfig-raw='{"compilerOptions":{"useDefineForClassFields":true}}'
```

```js [JS]
import * as esbuild from 'esbuild'

let ts = 'class Foo { foo }'
let result = await esbuild.transform(ts, {
  loader: 'ts',
  tsconfigRaw: `{
    "compilerOptions": {
      "useDefineForClassFields": true,
    },
  }`,
})
console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  ts := "class Foo { foo }"

  result := api.Transform(ts, api.TransformOptions{
    Loader: api.LoaderTS,
    TsconfigRaw: `{
      "compilerOptions": {
        "useDefineForClassFields": true,
      },
    }`,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

### Watch

> Supported by: [Build](./official/api/#build)

Enabling watch mode tells esbuild to listen for changes on the file system and to automatically rebuild whenever a file changes that could invalidate the build. Using it looks like this:

::: code-group

```bash [CLI] $(1)
esbuild app.js --outfile=out.js --bundle --watch
[watch] build finished, watching for changes...
```

```js [JS]
import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['app.js'],
  outfile: 'out.js',
  bundle: true,
})

await ctx.watch()
console.log('watching...')
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  ctx, err := api.Context(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Outfile:     "out.js",
    Bundle:      true,
    Write:       true,
  })
  if err != nil {
    os.Exit(1)
  }

  err2 := ctx.Watch(api.WatchOptions{})
  if err2 != nil {
    os.Exit(1)
  }
  fmt.Printf("watching...\n")

  // Returning from main() exits immediately in Go.
  // Block forever so we keep watching and don't exit.
  <-make(chan struct{})
}
```

:::

If you want to stop watch mode at some point in the future, you can call `dispose` on the context object to terminate the file watcher:

::: code-group

```bash [CLI]
# Use Ctrl+C to stop the CLI in watch mode
```

```js [JS]
import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['app.js'],
  outfile: 'out.js',
  bundle: true,
})

await ctx.watch()
console.log('watching...')

await new Promise(r => setTimeout(r, 10 * 1000))
await ctx.dispose()
console.log('stopped watching')
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"
import "os"
import "time"

func main() {
  ctx, err := api.Context(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Outfile:     "out.js",
    Bundle:      true,
    Write:       true,
  })
  if err != nil {
    os.Exit(1)
  }

  err2 := ctx.Watch(api.WatchOptions{})
  if err2 != nil {
    os.Exit(1)
  }
  fmt.Printf("watching...\n")

  time.Sleep(10 * time.Second)
  ctx.Dispose()
  fmt.Printf("stopped watching\n")
}
```

:::

Watch mode in esbuild is implemented using polling instead of OS-specific file system APIs for portability. The polling system is designed to use relatively little CPU vs. a more traditional polling system that scans the whole directory tree at once. The file system is still scanned regularly but each scan only checks a random subset of your files, which means a change to a file will be picked up soon after the change is made but not necessarily instantly.

With the current heuristics, large projects should be completely scanned around every 2 seconds so in the worst case it could take up to 2 seconds for a change to be noticed. However, after a change has been noticed the change's path goes on a short list of recently changed paths which are checked on every scan, so further changes to recently changed files should be noticed almost instantly.

Note that it is still possible to implement watch mode yourself using esbuild's [rebuild](./official/api#rebuild) API and a file watcher library of your choice if you don't want to use a polling-based approach.

If you are using the CLI, keep in mind that watch mode will be terminated when esbuild's stdin is closed. This prevents esbuild from accidentally outliving the parent process and unexpectedly continuing to consume resources on the system. If you have a use case that requires esbuild to continue to watch forever even when the parent process has finished, you may use `--watch=forever` instead of `--watch`.
