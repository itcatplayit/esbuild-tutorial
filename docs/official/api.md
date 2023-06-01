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
