# API

The API can be accessed in one of three languages: on the command line, in JavaScript, and in Go. The concepts and parameters are largely identical between the three languages so they will be presented together here instead of having separate documentation for each language. You can switch between languages using the `CLI`, `JS`, and `Go` tabs in the top-right corner of each code example. Some specifics for each language:

- **CLI**: If you are using the command-line API, it may be helpful to know that the flags come in one of three forms: `--foo`, `--foo=bar`, or `--foo:bar`. The form `--foo` is used for enabling boolean flags such as [--minify](#minify), the form `--foo=bar` is used for flags that have a single value and are only specified once such as [--platform=](#platform), and the form --foo:bar is used for flags that have multiple values and can be re-specified multiple times such as [--external:](#external).

- **JavaScript**: If you are using JavaScript be sure to check out the [JS-specific details](./official/api#js-details) and [browser](./official/api#browser) sections below. You may also find the [TypeScript type definitions](https://github.com/evanw/esbuild/blob/main/lib/shared/types.ts) for esbuild helpful as a reference.

- **Go**: If you are using Go, you may find the automatically generated Go documentation for esbuild helpful as a reference. There is separate documentation for both of the public Go packages: [`pkg/api`](https://pkg.go.dev/github.com/evanw/esbuild/pkg/api) and [`pkg/cli`](https://pkg.go.dev/github.com/evanw/esbuild/pkg/cli).

## Overview

The two most commonly-used esbuild APIs are [build](./official/api#build) and [transform](./official/api#transform). Each is described below at a high level, followed by documentation for each individual API option.

### Build

This is the primary interface to esbuild. You typically pass one or more [entry point]() files to process along with various options, and then esbuild writes the results back out to the file system. Here's a simple example that enables [bundling]() with an [output directory]():

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

- **[Watch mode]()** tells esbuild to watch the file system and automatically rebuild for you whenever you edit and save a file that could invalidate the build. Here's an example:

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

- **[Serve mode]()** starts a local development server that serves the results of the latest build. Incoming requests automatically start new builds so your web app is always up to date when you reload the page in the browser. Here's an example:

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

- **[Rebuild mode]()** lets you manually invoke a build. This is useful when integrating esbuild with other tools (e.g. using a custom file watcher or development server instead of esbuild's built-in ones). Here's an example:

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

These three incremental build APIs can be combined. To enable [live reloading]() (automatically reloading the page when you edit and save a file) you'll need to enable [watch]() and [serve]() together on the same context.

When you are done with a context object, you can call `dispose()` on the context to wait for existing builds to finish, stop watch and/or serve mode, and free up resources.

The build and context APIs both take the following options:

<div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
  <div style="width:200px">
    <p style="font-weight:bold;">General options:</p>
    <ul>
      <li>Bundle</li>
      <li>Cancel</li>
      <li>Live reload</li>
      <li>Platform</li>
      <li>Rebuild</li>
      <li>Serve</li>
      <li>Tsconfig</li>
      <li>Watch</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Input:</p>
    <ul>
      <li>Entry points</li>
      <li>Loader</li>
      <li>Stdin</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Output contents:</p>
    <ul>
      <li>Banner</li>
      <li>Charset</li>
      <li>Footer</li>
      <li>Format</li>
      <li>Global name</li>
      <li>Legal comments</li>
      <li>Splitting</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Output location:</p>
    <ul>
      <li>Allow overwrite</li>
      <li>Asset names</li>
      <li>Chunk names</li>
      <li>Entry names</li>
      <li>Out extension</li>
      <li>Outbase</li>
      <li>Outdir</li>
      <li>Outfile</li>
      <li>Public path</li>
      <li>Write</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Path resolution:</p>
    <ul>
      <li>Alias</li>
      <li>Conditions</li>
      <li>External</li>
      <li>Main fields</li>
      <li>Node paths</li>
      <li>Packages</li>
      <li>Preserve symlinks</li>
      <li>Resolve extensions</li>
      <li>Working directory</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Transformation:</p>
    <ul>
      <li>JSX</li>
      <li>JSX dev</li>
      <li>JSX factory</li>
      <li>JSX fragment</li>
      <li>JSX import source</li>
      <li>JSX side effects</li>
      <li>Supported</li>
      <li>Target</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Optimization:</p>
    <ul>
      <li>Define</li>
      <li>Drop</li>
      <li>Ignore annotations</li>
      <li>Inject</li>
      <li>Keep names</li>
      <li>Mangle props</li>
      <li>Minify</li>
      <li>Pure</li>
      <li>Tree shaking</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Source maps:</p>
    <ul>
      <li>Source root</li>
      <li>Sourcefile</li>
      <li>Sourcemap</li>
      <li>Sources content</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Build metadata:</p>
    <ul>
      <li>Analyze</li>
      <li>Metafile</li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">Logging:</p>
    <ul>
      <li>Color</li>
      <li>Format messages</li>
      <li>Log level</li>
      <li>Log limit</li>
      <li>Log override</li>
    </ul>
  </div>
</div>

## Transform

This is a limited special-case of [build]() that transforms a string of code representing an in-memory file in an isolated environment that's completely disconnected from any other files. Common uses include minifying code and transforming TypeScript into JavaScript. Here's an example:

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

Taking a string instead of a file as input is more ergonomic for certain use cases. File system isolation has certain advantages (e.g. works in the browser, not affected by nearby `package.json` files) and certain disadvantages (e.g. can't be used with [bundling]() or [plugins]()). If your use case doesn't fit the transform API then you should use the more general [build]() API instead.

The transform API takes the following options:
