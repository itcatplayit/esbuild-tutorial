# API

可以使用三种语言之一访问API：命令行、JavaScript和Go。这三种语言之间的概念和参数基本相同，因此它们将在这里一起呈现，而不是为每种语言提供单独的文档。您可以使用每个代码示例右上角的`CLI`, `JS`, 和 `Go`选项卡在语言之间切换。每种语言的更多细节：

- **CLI**: 如果用命令行API，有三种形式：`--foo`, `--foo=bar`, 或 `--foo:bar`。`--foo`形式是启用布尔标志，例如[--minify](#minify)，`--foo=bar`形式是当仅有一个值时指定一次，如[--platform=](#platform)，`--foo:bar`形式是有多个值时，多次重新指定，如[--external:](#external)。

- **JavaScript**: 如果使用JavaScript， 可以查看下面的[JS 规格详情](./api#js-details) 和 [浏览器](./api#browser)部分。可以找到esbuild的[TypeScript 类型定义](https://github.com/evanw/esbuild/blob/main/lib/shared/types.ts)的参考文档。

- **Go**: 如果使用Go，可以发现为esbuild自动生成的Go文档作为参考很有帮助。这两个公共Go包都有单独的文档：[`pkg/api`](https://pkg.go.dev/github.com/evanw/esbuild/pkg/api) 和 [`pkg/cli`](https://pkg.go.dev/github.com/evanw/esbuild/pkg/cli)。

## 概述

两种常用的esbuild API是[build](./api#build) 和 [transform](./api#transform)。下面对每一个选项进行了详细描述，然后是每个API选项的文档。

### Build

这是esbuild的主要接口。通常会传递一个或多个[入口点](#entry-points)文件和各种选项进行处理，然后esbuild将结果写回文件系统。下面是一个简单的示例，它支持与[输出目录](#outdir)[打包](#bundle)：

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

构建API的高级使用涉及设置长时间运行的构建上下文。此上下文在JS和Go中是一个显式对象，但在CLI中是隐式的。使用给定上下文完成的所有构建都共享相同的构建选项，并且后续构建是增量完成的（即，它们重用以前构建的一些工作以提高性能）。这对开发很有用，因为esbuild可以在您工作时在后台为您重建应用程序。

有三种不同的增量构建API：

- **[监听模式](#watch)** 告诉esbuild监视文件系统，并在您编辑和保存可能使构建无效的文件时为您自动重建。以下是一个示例：

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

- **[服务模式](#serve)** 启动一个本地开发服务器，该服务器提供最新构建的结果。传入的请求会自动启动新的构建，因此当您在浏览器中重新加载页面时，您的web应用程序始终是最新的。以下是一个示例：

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

- **[重编译模式](#rebuild)** 允许您手动调用生成。这在将esbuild与其他工具集成时非常有用（例如，使用自定义文件观察程序或开发服务器，而不是esbuild的内置服务器）。以下是一个示例：

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

这三个增量构建API可以组合在一起。要启用[热更新](#live-reload)（在编辑和保存文件时自动重新加载页面），需要在同一上下文中同时启用[watch](#watch) 和 [serve](#serve)。

处理完上下文对象后，可以在上下文上调用`dispose()`以等待现有构建完成，停止监视和/或服务模式，并释放资源。

构建API和上下文API都采用以下选项：

<div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
  <div style="width:200px">
    <p style="font-weight:bold;">常规选项：</p>
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
    <p style="font-weight:bold;">输入：</p>
    <ul>
      <li><a href="#entry-points">Entry points</a></li>
      <li><a href="#loader">Loader</a></li>
      <li><a href="#stdin">Stdin</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">输出内容：</p>
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
    <p style="font-weight:bold;">输出位置：</p>
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
    <p style="font-weight:bold;">路径解决方案：</p>
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
    <p style="font-weight:bold;">转换：</p>
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
    <p style="font-weight:bold;">优化：</p>
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
    <p style="font-weight:bold;">源码映射：</p>
    <ul>
      <li><a href="#source-root">Source root</a></li>
      <li><a href="#sourcefile">Sourcefile</a></li>
      <li><a href="#sourcemap">Sourcemap</a></li>
      <li><a href="#sources-content">Sources content</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">构建元数据：</p>
    <ul>
      <li><a href="#analyze">Analyze</a></li>
      <li><a href="#metafile">Metafile</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">日志：</p>
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

这是一种有限的特殊[构建](#build)情况，它在与任何其他文件完全断开连接的隔离环境中转换表示内存中文件的代码字符串。常见的用途包括缩小代码和将TypeScript转换为JavaScript。以下是一个示例：

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

对于某些用例来说，使用字符串而不是文件作为输入更符合人体工程学。文件系统隔离有某些优点（例如在浏览器中工作，不受附近的`package.json`文件的影响）和某些缺点（例如不能与[bundling](#bundle)或[plugins](./offficial/plugins)一起使用）。如果您的用例不适合转换API，那么您应该使用更通用的[build](#build) API。

转换API采用以下选项：

<div style="display:flex;justify-content:space-between;flex-wrap:wrap;">
  <div style="width:200px">
    <p style="font-weight:bold;">常规选项：</p>
    <ul>
      <li><a href="#platform">Platform</a></li>
      <li><a href="#tsconfig-raw">Tsconfig raw</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">输入：</p>
    <ul>
      <li><a href="#loader">Loader</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">输出内容：</p>
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
    <p style="font-weight:bold;">转换：</p>
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
    <p style="font-weight:bold;">优化：</p>
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
    <p style="font-weight:bold;">源码映射：</p>
    <ul>
      <li><a href="#source-root">Source root</a></li>
      <li><a href="#sourcefile">Sourcefile</a></li>
      <li><a href="#sourcemap">Sourcemap</a></li>
      <li><a href="#sources-content">Sources content</a></li>
    </ul>
  </div>
  <div style="width:200px">
    <p style="font-weight:bold;">日志：</p>
    <ul>
      <li><a href="#color">Color</a></li>
      <li><a href="#format-messages">Format messages</a></li>
      <li><a href="#log-level">Log level</a></li>
      <li><a href="#log-limit">Log limit</a></li>
      <li><a href="#log-override">Log override</a></li>
    </ul>
  </div>
</div>

### JS具体细节

esbuild的JS API有异步和同步两种风格。建议使用[异步 API](#js-async)，因为它适用于所有环境，而且速度更快、功能更强大。[同步 API](#js-sync)只在节点中工作，只能做某些事情，但有时在特定于节点的情况下是必要的。详细说明：

#### 异步 API

异步API调用使用promise返回结果。注意，由于使用了`import`和顶级`await`关键字，您可能不得不在节点中使用`.mjs`文件扩展名：

```js
import * as esbuild from 'esbuild'

let result1 = await esbuild.transform(code, options)
let result2 = await esbuild.build(options)
```

优点：

- 您可以将[plugins](./plugins)与异步API一起使用
- 当前线程未被阻止，因此您可以在此期间执行其他工作
- 您可以同时运行多个esbuild API调用，然后这些调用分布在所有可用CPU上，以获得最佳性能

缺点：

- 使用promise可能会导致更混乱的代码，尤其是在CommonJS中[顶层 await](https://v8.dev/features/top-level-await)不可用
- 在必须同步的情况下不起作用，例如在[`require.extensions`](https://nodejs.org/api/modules.html#requireextensions)中

#### 同步 API

同步API调用以内联方式返回结果：

```js
let esbuild = require('esbuild')

let result1 = esbuild.transformSync(code, options)
let result2 = esbuild.buildSync(options)
```

缺点：

-您不能将[plugins](./plugins)与同步API一起使用，因为插件是异步的

-它阻塞了当前线程，因此在此期间无法执行其他工作

-使用同步API可以防止esbuild并行esbuild-API调用

优点：

- 避免承诺可能会导致更干净的代码，尤其是当[top-level await](https://v8.dev/features/top-level-await)不可用
- 在必须同步的情况下工作，例如在[`require.extensions`](https://nodejs.org/api/modules.html#requireextensions)中

缺点：

- 您不能将[plugins](./plugins)与同步API一起使用，因为插件是异步的
- 它阻塞了当前线程，因此在此期间无法执行其他工作
- 使用同步API可以防止esbuild并行esbuild-API调用

### 在浏览器中

esbuild API还可以在Web Worker中使用WebAssembly在浏览器中运行。要利用这一点，您将需要安装`esbuild-wasm`包，而不是`esbuild`包：

```bash
npm install esbuild-wasm
```

浏览器的API与节点的API类似，只是需要先调用`initialize()`，并且需要传递WebAssembly二进制文件的URL。API的同步版本也不可用。假设您使用的是打包器，它看起来是这样的：

```js
import * as esbuild from 'esbuild-wasm'

await esbuild.initialize({
  wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
})

let result1 = await esbuild.transform(code, options)
let result2 = esbuild.build(options)
```

如果您已经从工作线程运行此代码，并且不希望 `initialize`创建另一个工作线程，则可以将`worker: false`传递给它。然后，它将在与调用`initialize`的线程相同的线程中创建WebAssembly模块。

您也可以将esbuild的API用作HTML文件中的脚本标记，而无需使用绑定器，方法是加载带有`<script>`标记的`lib/browser.min.js`文件。在这种情况下，API会创建一个名为esbuild的全局，其中包含API对象：

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

如果要将此API与ECMAScript模块一起使用，则应导入`esm/browser.min.js`文件：

```html
<script type="module">
  import * as esbuild from './node_modules/esbuild-wasm/esm/browser.min.js'

  await esbuild.initialize({
    wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
  })

  ...
</script>
```

## 常规选项

### 打包

> 支持: [Build](#build)

打包文件意味着将任何导入的依赖项内联到文件本身中。这个过程是递归的，所以依赖项的依赖项（等等）也将被内联。默认情况下，esbuild不会打包输入文件。打包必须显式启用，如下所示：

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

参考[开始入门](./getting-started/#your-first-bundle)的现实代码打包的例子。

注意，打包不同于文件串联。在启用打包的情况下传递esbuild多个输入文件将创建多个单独的分包，而不是将输入文件连接在一起。要将一组文件与esbuild连接在一起，请将它们全部导入到一个入口点文件中，并将该文件与esuild打包在一起。

### 不分析的导入

与esbuild打包仅适用于静态定义的导入（即，当导入路径是字符串文字时）。在运行时定义的导入（即依赖于运行时代码评估的导入）不会打包，因为打包是一种编译时操作。例如：

```js
// 分析导入（将会被esbuild打包）
import 'pkg';
import('pkg');
require('pkg');

// 不分析导入（不会被esbuild打包）
import(`pkg/${foo}`);
require(`pkg/${foo}`);
['pkg'].map(require);
```

解决此问题的方法是将包含此问题代码的包标记为[external](#external)，这样它就不会包含在打包中。然后，您需要确保在运行时打包代码可以使用外部包的副本。

一些打包器，如[Webpack](https://webpack.js.org/)尝试通过将所有可能访问的文件包括在捆绑包中，然后在运行时模拟文件系统来支持这一点。但是，运行时文件系统仿真超出了范围，将不会在esbuild中实现。如果您真的需要打包这样做的代码，那么您可能需要使用另一个打包器而不是esbuild。

### 取消

> 支持: [Build](#build)

如果您正在使用[rebuild](#rebuild)手动调用增量构建，您可能希望使用此取消API提前结束当前构建，以便可以启动新的构建。你可以这样做：

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

请确保等到取消操作完成后再开始新的构建（即，在使用JavaScript时等待返回的promise），否则下一次[重建](#rebuild)将为您提供尚未结束的刚刚取消的构建。请注意，无论构建是否被取消，插件[持续回调](./plugins#on-end)仍将运行。

### 实时重新加载

> 支持: [Build](#build)

实时重新加载是一种开发方法，在这种方法中，您可以打开浏览器并与代码编辑器同时可见。当您编辑并保存源代码时，浏览器会自动重新加载，并且重新加载的应用程序版本包含您的更改。这意味着您可以更快地迭代，因为您不必手动切换到浏览器，重新加载，然后在每次更改后切换回代码编辑器。例如，它在更改CSS时非常有用。

没有esbuild API可直接用于实时重新加载。相反，您可以通过组合[监听模式](#watch)（在编辑和保存文件时自动启动构建）和[服务模式](#watch)（为最新构建提供服务，但在完成之前进行阻止）以及仅在开发过程中添加到应用程序中的少量客户端JavaScript代码来构建实时重载。

第一步是实现[watch](#watch)和[serve](#serve)的结合：

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

第二步是向JavaScript中添加一些代码，这些代码订阅`/ebuild`[服务器发送的事件源](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)。当您获得`change`事件时，您可以重新加载页面以获取应用程序的最新版本。您可以在一行代码中完成此操作：

```js
new EventSource('/esbuild').addEventListener('change', () => location.reload())
```

就是这样！如果你在浏览器中加载应用程序，那么当你编辑和保存文件时，页面现在应该会自动重新加载（假设没有生成错误）。

这只应包括在开发过程中，而不应包括在生产中。在生产中删除此代码的一种方法是使用if语句（如`if (!window.IS_PRODUCTION)`）保护它，然后在生产中使用[define](#define)将`window.IS_PRODUCTION`设置为`true`。

#### 实时重新加载注意事项

像这样实现实时重载有几个已知的注意事项：

- 这些事件仅在esbuild的输出更改时触发。当与正在监视的生成无关的文件发生更改时，它们不会触发。如果您的HTML文件引用了esbuild不知道的其他文件，并且这些文件已更改，您可以手动重新加载页面，也可以实现自己的实时重新加载基础结构，而不是使用esbuild的内置行为。

- `EventSource` API应该会自动为您重新连接。然而，如果服务器暂时无法访问，[Firefox中有一个错误](https://bugzilla.mozilla.org/show_bug.cgi?id=1809332)会破坏这一点。解决方法是使用任何其他浏览器，在出现这种情况时手动重新加载页面，或者在出现连接错误时编写更复杂的代码，手动关闭并重新创建`EventSource`对象。

- 浏览器供应商决定不在没有TLS的情况下实现HTTP/2。这意味着，当使用`http://`协议时，每个`/ebuild`事件源将占用宝贵的6个同时每个域http/1.1连接中的一个。因此，如果您打开六个以上使用这种实时重新加载技术的HTTP选项卡，您将无法在其中一些选项卡中使用实时重新加载（其他事情也可能会中断）。解决方法是[启用https://协议](https://esbuild.github.io/api/#https)。

#### CSS热加载

`change`事件还包含用于启用更高级用例的附加信息。它目前包含`added`、`removed`和`updated`的数组，其中包含自上一次生成以来更改的文件的路径，可以通过以下TypeScript接口进行描述：

```ts
interface ChangeEvent {
  added: string[]
  removed: string[]
  updated: string[]
}
```

下面的代码示例支持CSS的“热重新加载”，即在不重新加载页面的情况下自动更新CSS。如果出现与CSS无关的事件，则整个页面将作为回退重新加载：

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

#### JavaScript热加载

esbuild当前未实现JavaScript的热重新加载。可以透明地实现CSS的热重载，因为CSS是无状态的，但JavaScript是有状态的，所以不能像CSS那样透明地实现JavaScript的热重载。

其他一些开发服务器无论如何都实现了JavaScript的热重新加载，但它需要额外的API，有时需要特定于框架的黑客攻击，有时还会在编辑会话期间引入与瞬态相关的错误。这样做超出了esbuild的范围。如果JavaScript的热重新加载是您的需求之一，那么欢迎您使用其他工具而不是esbuild。

然而，通过esbuild的实时重新加载，您可以在[`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)中保持应用程序的当前JavaScript状态，以便在页面重新加载后更容易地恢复应用程序的JavaScript状态。如果你的应用程序加载很快（为了用户的利益，它已经应该加载了），那么使用JavaScript的实时重新加载几乎可以像使用JavaScript的热重新加载一样快。

### Platform

> Supported by: [Build](./api#build) and [Transform](./api#transform)

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

- When [bundling](./api#bundle) is enabled the default output [format](./api#format) is set to `iife`, which wraps the generated JavaScript code in an immediately-invoked function expression to prevent variables from leaking into the global scope.

- If a package specifies a map for the [`browser`](https://gist.github.com/defunctzombie/4339901/49493836fb873ddaa4b8a7aa0ef2352119f69211) field in its `package.json` file, esbuild will use that map to replace specific files or modules with their browser-friendly versions. For example, a package might contain a substitution of [`path`](https://nodejs.org/api/path.html) with [`path-browserify`](https://www.npmjs.com/package/path-browserify).

- The [main fields](./api#main-fields) setting is set to `browser,module,main` but with some additional special behavior: if a package provides `module` and `main` entry points but not a `browser` entry point then `main` is used instead of `module` if that package is ever imported using `require()`. This behavior improves compatibility with CommonJS modules that export a function by assigning it to `module.exports`. If you want to disable this additional special behavior, you can explicitly set the [main fields](./api#main-fields) setting to `browser,module,main`.

- The [conditions](./api#conditions) setting automatically includes the `browser` condition. This changes how the `exports` field in `package.json` files is interpreted to prefer browser-specific code.

- If no custom [conditions](./api#conditions) are configured, the Webpack-specific `module` condition is also included. The `module` condition is used by package authors to provide a tree-shakable ESM alternative to a CommonJS file without creating a [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard). You can prevent the `module` condition from being included by explicitly configuring some custom conditions (even an empty list).

- When using the [build](./api#build) API, all `process.env.NODE_ENV` expressions are automatically [defined](./api#define) to `"production"` if all [minification](./api#minify) options are enabled and `"development"` otherwise. This only happens if `process`, `process.env`, and `process.env.NODE_ENV` are not already defined. This substitution is necessary to avoid React-based code crashing instantly (since `process` is a node API, not a web API).

- The character sequence `</script>` will be escaped in JavaScript code and the character sequence `</style>` will be escaped in CSS code. This is done in case you inline esbuild's output directly into an HTML file. This can be disabled with esbuild's [supported](./api#supported) feature by `setting inline-script` (for JavaScript) and/or `inline-style` (for CSS) to `false`.

When the platform is set to `node`:

- When [bundling](./api#bundle) is enabled the default output [format](./api#format) is set to `cjs`, which stands for CommonJS (the module format used by node). ES6-style exports using `export` statements will be converted into getters on the CommonJS `exports` object.

- All [built-in node modules](https://nodejs.org/docs/latest/api/) such as `fs` are automatically marked as [external](./api#external) so they don't cause errors when the bundler tries to bundle them.

- The [main fields](./api#main-fields) setting is set to `main,module`. This means tree shaking will likely not happen for packages that provide both `module` and `main` since tree shaking works with ECMAScript modules but not with CommonJS modules.

  Unfortunately some packages incorrectly treat `module` as meaning "browser code" instead of "ECMAScript module code" so this default behavior is required for compatibility. You can manually configure the [main fields](./api#main-fields) setting to `module,main` if you want to enable tree shaking and know it is safe to do so.

- The [conditions](./api#conditions) setting automatically includes the `node` condition. This changes how the `exports` field in `package.json` files is interpreted to prefer node-specific code.

- If no custom [conditions](./api#conditions) are configured, the Webpack-specific `module` condition is also included. The `module` condition is used by package authors to provide a tree-shakable ESM alternative to a CommonJS file without creating a [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard). You can prevent the `module` condition from being included by explicitly configuring some custom conditions (even an empty list).

- When the [format](./api#format) is set to `cjs` but the entry point is ESM, esbuild will add special annotations for any named exports to enable importing those named exports using ESM syntax from the resulting CommonJS file. Node's documentation has more information about [node's detection of CommonJS named exports](https://nodejs.org/api/esm.html#commonjs-namespaces).

- The [`binary`](./content-types/#binary) loader will make use of node's built-in [`Buffer.from`](https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding) API to decode the base64 data embedded in the bundle into a `Uint8Array`. This is faster than what esbuild can do otherwise since it's implemented by node in native code.

When the platform is set to `neutral`:

- When [bundling](./api#bundle) is enabled the default output [format](./api#format) is set to `esm`, which uses the `export` syntax introduced with ECMAScript 2015 (i.e. ES6). You can change the output format if this default is not appropriate.

- The [main fields](./api#main-fields) setting is empty by default. If you want to use npm-style packages, you will likely have to configure this to be something else such as main for the standard `main` field used by node.

- The [conditions](./api#conditions) setting does not automatically include any platform-specific values.

See also [bundling for the browser](./getting-started/#bundling-for-the-browser) and [bundling for node](./getting-started/#bundling-for-node).

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

> Supported by: [Build](./api#build)

::: info

If you want your app to automatically reload as you edit, you should read about [live reloading](./api#live-reload). It combines serve mode with [watch mode](./api#watch) to listen for changes to the file system.

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

If you pass a private key and certificate to esbuild using `keyfile` and `certfile`, then esbuild's web server will use the `https://` protocol instead of the `http://` protocol. See [enabling HTTPS](./api#https) for more information.

- `onRequest`

This is called once for each incoming request with some information about the request. This callback is used by the CLI to print out a log message for each request. The time field is the time to generate the data for the request, but it does not include the time to stream the request to the client.

Note that this is called after the request has completed. It's not possible to use this callback to modify the request in any way. If you want to do this, you should [put a proxy in front of esbuild](./api#serve-proxy) instead.

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

2. Pass `your.key` and `your.cert` to esbuild using the `keyfile` and `certfile` [serve arguments](./api/#serve-arguments).

3. Click past the scary warning in your browser when you load your page (self-signed certificates aren't secure, but that doesn't matter since we're just doing local development).

If you have more complex needs than this, you can still [put a proxy in front of esbuild](./api/#serve-proxy) and use that for HTTPS instead. Note that if you see the message `Client sent an HTTP request to an HTTPS server` when you load your page, then you are using the incorrect protocol. Replace `http://` with `https://` in your browser's URL bar.

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

> Supported by: [Build](./api/#build)

Normally the [build](./api/#build) API automatically discovers `tsconfig.json` files and reads their contents during a build. However, you can also configure a custom `tsconfig.json` file to use instead. This can be useful if you need to do multiple builds of the same code with different settings:

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

> Supported by: [Transform](./api/#transform)

This option can be used to pass your `tsconfig.json` file to the [transform](./api/#transform) API, which doesn't access the file system. Using it looks like this:

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

> Supported by: [Build](./api/#build)

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

Note that it is still possible to implement watch mode yourself using esbuild's [rebuild](./api#rebuild) API and a file watcher library of your choice if you don't want to use a polling-based approach.

If you are using the CLI, keep in mind that watch mode will be terminated when esbuild's stdin is closed. This prevents esbuild from accidentally outliving the parent process and unexpectedly continuing to consume resources on the system. If you have a use case that requires esbuild to continue to watch forever even when the parent process has finished, you may use `--watch=forever` instead of `--watch`.

## Input

### Entry points

> Supported by: [Build](./api/#build)

This is an array of files that each serve as an input to the bundling algorithm. They are called "entry points" because each one is meant to be the initial script that is evaluated which then loads all other aspects of the code that it represents. Instead of loading many libraries in your page with `<script>` tags, you would instead use `import` statements to import them into your entry point (or into another file that is then imported into your entry point).

Simple apps only need one entry point but additional entry points can be useful if there are multiple logically-independent groups of code such as a main thread and a worker thread, or an app with separate relatively unrelated areas such as a landing page, an editor page, and a settings page. Separate entry points helps introduce separation of concerns and helps reduce the amount of unnecessary code that the browser needs to download. If applicable, enabling [code splitting](./api/#splitting) can further reduce download sizes when browsing to a second page whose entry point shares some already-downloaded code with a first page that has already been visited.

The simple way to specify entry points is to just pass an array of file paths:

::: code-group

```bash [CLI]
esbuild home.ts settings.ts --bundle --outdir=out
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['home.ts', 'settings.ts'],
  bundle: true,
  write: true,
  outdir: 'out',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"home.ts", "settings.ts"},
    Bundle:      true,
    Write:       true,
    Outdir:      "out",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

This will generate two output files, `out/home.js` and `out/settings.js` corresponding to the two entry points `home.ts` and `settings.ts`.

For further control over how the paths of the output files are derived from the corresponding input entry points, you should look into these options:

- [Entry names](./api/#entry-names)
- [Out extension](./api/#out-extension)
- [Outbase](./api/#outbase)
- [Outdir](./api/#outdir)
- [Outfile](./api/#outfile)

In addition, you can also specify a fully custom output path for each individual entry point using an alternative entry point syntax:


::: code-group

```bash [CLI]
esbuild out1=home.ts out2=settings.ts --bundle --outdir=out
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    { out: 'out1', in: 'home.ts'},
    { out: 'out2', in: 'settings.ts'},
  ],
  bundle: true,
  write: true,
  outdir: 'out',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPointsAdvanced: []api.EntryPoint{{
      OutputPath: "out1",
      InputPath:  "home.ts",
    }, {
      OutputPath: "out2",
      InputPath:  "settings.ts",
    }},
    Bundle: true,
    Write:  true,
    Outdir: "out",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

This will generate two output files, `out/out1.js` and `out/out2.js` corresponding to the two entry points `home.ts` and `settings.ts`.

### Loader

> Supported by: [Build](./api#build) and [Transform](./api#transform)

This option changes how a given input file is interpreted. For example, the `js` loader interprets the file as JavaScript and the [`css`](./content-types/#css) loader interprets the file as CSS. See the [content types](./content-types/) page for a complete list of all built-in loaders.

Configuring a loader for a given file type lets you load that file type with an `import` statement or a `require` call. For example, configuring the `.png` file extension to use the [data URL](./content-types/#data-url) loader means importing a `.png` file gives you a data URL containing the contents of that image:

```js
import url from './example.png'
let image = new Image
image.src = url
document.body.appendChild(image)

import svg from './example.svg'
let doc = new DOMParser().parseFromString(svg, 'application/xml')
let node = document.importNode(doc.documentElement, true)
document.body.appendChild(node)
```

The above code can be bundled using the [build](./api#build) API call like this:

::: code-group

```bash [CLI]
esbuild app.js --bundle --loader:.png=dataurl --loader:.svg=text
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  loader: {
    '.png': 'dataurl',
    '.svg': 'text',
  },
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
    Loader: map[string]api.Loader{
      ".png": api.LoaderDataURL,
      ".svg": api.LoaderText,
    },
    Write: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

This option is specified differently if you are using the build API with input from [stdin]((./api#stdin), since stdin does not have a file extension. Configuring a loader for stdin with the build API looks like this:

::: code-group

```bash [CLI]
echo 'import pkg = require("./pkg")' | esbuild --loader=ts --bundle
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  stdin: {
    contents: 'import pkg = require("./pkg")',
    loader: 'ts',
    resolveDir: '.',
  },
  bundle: true,
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    Stdin: &api.StdinOptions{
      Contents:   "import pkg = require('./pkg')",
      Loader:     api.LoaderTS,
      ResolveDir: ".",
    },
    Bundle: true,
  })
  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

The [transform](./api#transform) API call just takes a single loader since it doesn't involve interacting with the file system, and therefore doesn't deal with file extensions. Configuring a loader (in this case the [`ts`](./content-types/#typescript) loader) for the transform API looks like this:

::: code-group

```bash [CLI] $(1)
echo 'let x: number = 1' | esbuild --loader=ts
let x = 1;
```

```js [JS]
import * as esbuild from 'esbuild'

let ts = 'let x: number = 1'
let result = await esbuild.transform(ts, {
  loader: 'ts',
})
console.log(result.code)
```

```go [Go]
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

### Stdin

> Supported by: [Build](./api#build)

Normally the build API call takes one or more file names as input. However, this option can be used to run a build without a module existing on the file system at all. It's called "stdin" because it corresponds to piping a file to stdin on the command line.

In addition to specifying the contents of the stdin file, you can optionally also specify the resolve directory (used to determine where relative imports are located), the [sourcefile](./api#sourcefile) (the file name to use in error messages and source maps), and the [loader](./api#loader) (which determines how the file contents are interpreted). The CLI doesn't have a way to specify the resolve directory. Instead, it's automatically set to the current working directory.

Here's how to use this feature:

::: code-group

```bash [CLI]
echo 'export * from "./another-file"' | esbuild --bundle --sourcefile=imaginary-file.js --loader=ts --format=cjs

```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  stdin: {
    contents: `export * from "./another-file"`,

    // These are all optional:
    resolveDir: './src',
    sourcefile: 'imaginary-file.js',
    loader: 'ts',
  },
  format: 'cjs',
  write: false,
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    Stdin: &api.StdinOptions{
      Contents: "export * from './another-file'",

      // These are all optional:
      ResolveDir: "./src",
      Sourcefile: "imaginary-file.js",
      Loader:     api.LoaderTS,
    },
    Format: api.FormatCommonJS,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

## Output contents

### Banner

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

Use this to insert an arbitrary string at the beginning of generated JavaScript and CSS files. This is commonly used to insert comments:

::: code-group

```bash [CLI]
esbuild app.js --banner:js=//comment --banner:css=/*comment*/
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  banner: {
    js: '//comment',
    css: '/*comment*/',
  },
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
    Banner: map[string]string{
      "js":  "//comment",
      "css": "/*comment*/",
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

This is similar to [footer](./api/#footer) which inserts at the end instead of the beginning.

Note that if you are inserting non-comment code into a CSS file, be aware that CSS ignores all `@import` rules that come after a non-`@import` rule (other than a `@charset` rule), so using a banner to inject CSS rules may accidentally disable imports of external stylesheets.

### Charset

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

By default esbuild's output is ASCII-only. Any non-ASCII characters are escaped using backslash escape sequences. One reason is because non-ASCII characters are misinterpreted by the browser by default, which causes confusion. You have to explicitly add `<meta charset="utf-8">` to your HTML or serve it with the correct `Content-Type` header for the browser to not mangle your code. Another reason is that non-ASCII characters can significantly [slow down the browser's parser](https://v8.dev/blog/scanner). However, using escape sequences makes the generated output slightly bigger, and also makes it harder to read.

If you would like for esbuild to print the original characters without using escape sequences and you have ensured that the browser will interpret your code as UTF-8, you can disable character escaping by setting the charset:

::: code-group

```bash [CLI] $(1,4)
echo 'let π = Math.PI' | esbuild
let \u03C0 = Math.PI;

echo 'let π = Math.PI' | esbuild --charset=utf8
let π = Math.PI;
```

```js [JS] $(1,3,5,8>)
import * as esbuild from 'esbuild'

let js = 'let π = Math.PI'

(await esbuild.transform(js)).code
'let \\u03C0 = Math.PI;\n'

(await esbuild.transform(js, {
  charset: 'utf8',
})).code
'let π = Math.PI;\n'
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "let π = Math.PI"

  result1 := api.Transform(js, api.TransformOptions{})

  if len(result1.Errors) == 0 {
    fmt.Printf("%s", result1.Code)
  }

  result2 := api.Transform(js, api.TransformOptions{
    Charset: api.CharsetUTF8,
  })

  if len(result2.Errors) == 0 {
    fmt.Printf("%s", result2.Code)
  }
}
```

:::

Some caveats:

- This does not yet escape non-ASCII characters embedded in regular expressions. This is because esbuild does not currently parse the contents of regular expressions at all. The flag was added despite this limitation because it's still useful for code that doesn't contain cases like this.

- This flag does not apply to comments. I believe preserving non-ASCII data in comments should be fine because even if the encoding is wrong, the run time environment should completely ignore the contents of all comments. For example, the [V8 blog post](https://v8.dev/blog/scanner) mentions an optimization that avoids decoding comment contents completely. And all comments other than license-related comments are stripped out by esbuild anyway.

- This option simultaneously applies to all output file types (JavaScript, CSS, and JSON). So if you configure your web server to send the correct `Content-Type` header and want to use the UTF-8 charset, make sure your web server is configured to treat both `.js` and `.css` files as UTF-8.

### Footer

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

Use this to insert an arbitrary string at the end of generated JavaScript and CSS files. This is commonly used to insert comments:

::: code-group

```bash [CLI]
esbuild app.js --footer:js=//comment --footer:css=/*comment*/
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  footer: {
    js: '//comment',
    css: '/*comment*/',
  },
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
    Footer: map[string]string{
      "js":  "//comment",
      "css": "/*comment*/",
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

This is similar to [banner](./api/#banner) which inserts at the beginning instead of the end.

### Format

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)


This sets the output format for the generated JavaScript files. There are currently three possible values that can be configured: `iife`, `cjs`, and `esm`. When no output format is specified, esbuild picks an output format for you if [bundling](./api/#bundle) is enabled (as described below), or doesn't do any format conversion if [bundling](./api/#bundle) is disabled.

#### IIFE

The iife format stands for "immediately-invoked function expression" and is intended to be run in the browser. Wrapping your code in a function expression ensures that any variables in your code don't accidentally conflict with variables in the global scope. If your entry point has exports that you want to expose as a global in the browser, you can configure that global's name using the [global name](./api/#global-name) setting. The `iife` format will automatically be enabled when no output format is specified, [bundling](./api/#bundle) is enabled, and [platform](./api/#platform) is set to `browser` (which it is by default). Specifying the `iife` format looks like this:

::: code-group

```bash [CLI] $(1)
echo 'alert("test")' | esbuild --format=iife
(() => {
  alert("test");
})();
```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'alert("test")'
let result = await esbuild.transform(js, {
  format: 'iife',
})
console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "alert(\"test\")"

  result := api.Transform(js, api.TransformOptions{
    Format: api.FormatIIFE,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

#### CommonJS

The `cjs` format stands for "CommonJS" and is intended to be run in node. It assumes the environment contains `exports`, `require`, and `module`. Entry points with exports in ECMAScript module syntax will be converted to a module with a getter on `exports` for each export name. The `cjs` format will automatically be enabled when no output format is specified, [bundling](./api/#bundle) is enabled, and [platform](./api/#platform) is set to `node`. Specifying the `cjs` format looks like this:

::: code-group

```bash [CLI] $(1)
echo 'export default "test"' | esbuild --format=cjs
...
var stdin_exports = {};
__export(stdin_exports, {
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var stdin_default = "test";
```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'export default "test"'
let result = await esbuild.transform(js, {
  format: 'cjs',
})
console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "export default 'test'"

  result := api.Transform(js, api.TransformOptions{
    Format: api.FormatCommonJS,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

#### ESM

The `esm` format stands for "ECMAScript module". It assumes the environment supports `import` and `export` syntax. Entry points with exports in CommonJS module syntax will be converted to a single `default` export of the value of `module.exports`. The `esm` format will automatically be enabled when no output format is specified, [bundling](./api/#bundle) is enabled, and [platform](./api/#platform) is set to `neutral`. Specifying the `esm` format looks like this:

::: code-group

```bash [CLI] $(1)
echo 'module.exports = "test"' | esbuild --format=esm
...
var require_stdin = __commonJS({
  "<stdin>"(exports, module) {
    module.exports = "test";
  }
});
export default require_stdin();
```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'module.exports = "test"'
let result = await esbuild.transform(js, {
  format: 'esm',
})
console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "module.exports = 'test'"

  result := api.Transform(js, api.TransformOptions{
    Format: api.FormatESModule,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

The `esm` format can be used either in the browser or in node, but you have to explicitly load it as a module. This happens automatically if you `import` it from another module. Otherwise:

In the browser, you can load a module using `<script src="file.js" type="module"></script>`.
 
In node, you can load a module using `node --experimental-modules file.mjs`. Note that node requires the .mjs extension unless you have configured `"type": "module"` in your `package.json` file. You can use the [out extension](./api/#out-extension) setting in esbuild to customize the output extension for the files esbuild generates. You can read more about using ECMAScript modules in node [here](https://nodejs.org/api/esm.html).

### Global name

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This option only matters when the [format](./api/#format) setting is `iife` (which stands for immediately-invoked function expression). It sets the name of the global variable which is used to store the exports from the entry point:

::: code-group

```bash [CLI]
echo 'module.exports = "test"' | esbuild --format=iife --global-name=xyz

```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'module.exports = "test"'
let result = await esbuild.transform(js, {
  format: 'iife',
  globalName: 'xyz',
})
console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "module.exports = 'test'"

  result := api.Transform(js, api.TransformOptions{
    Format:     api.FormatIIFE,
    GlobalName: "xyz",
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

Specifying the global name with the `iife` format will generate code that looks something like this:

```js
var xyz = (() => {
  ...
  var require_stdin = __commonJS((exports, module) => {
    module.exports = "test";
  });
  return require_stdin();
})();
```

The global name can also be a compound property expression, in which case esbuild will generate a global variable with that property. Existing global variables that conflict will not be overwritten. This can be used to implement "namespacing" where multiple independent scripts add their exports onto the same global object. For example:

::: code-group

```bash [CLI]
echo 'module.exports = "test"' | esbuild --format=iife --global-name='example.versions["1.0"]'
```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'module.exports = "test"'
let result = await esbuild.transform(js, {
  format: 'iife',
  globalName: 'example.versions["1.0"]',
})
console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "module.exports = 'test'"

  result := api.Transform(js, api.TransformOptions{
    Format:     api.FormatIIFE,
    GlobalName: `example.versions["1.0"]`,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

The compound global name used above generates code that looks like this:

```js
var example = example || {};
example.versions = example.versions || {};
example.versions["1.0"] = (() => {
  ...
  var require_stdin = __commonJS((exports, module) => {
    module.exports = "test";
  });
  return require_stdin();
})();
```

### Legal comments

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

A "legal comment" is considered to be any statement-level comment in JS or rule-level comment in CSS that contains `@license` or `@preserve` or that starts with `//!` or `/*!`. These comments are preserved in output files by default since that follows the intent of the original authors of the code. However, this behavior can be configured by using one of the following options:

- `none`
  
  Do not preserve any legal comments.

- `inline`

  Preserve all legal comments.

- `eof`

  Move all legal comments to the end of the file.

- `linked`

  Move all legal comments to a `.LEGAL.txt` file and link to them with a comment.

- `external`

  Move all legal comments to a `.LEGAL.txt` file but to not link to them.

The default behavior is `eof` when [bundling](./api/#bundle) is enabled and `inline` otherwise. Setting the legal comment mode looks like this:

::: code-group

```bash [CLI]
esbuild app.js --legal-comments=eof
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  legalComments: 'eof',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:   []string{"app.js"},
    LegalComments: api.LegalCommentsEndOfFile,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Note that "statement-level" for JS and "rule-level" for CSS means the comment must appear in a context where multiple statements or rules are allowed such as in the top-level scope or in a statement or rule block. So comments inside expressions or at the declaration level are not considered legal comments.

### Splitting

> Supported by: [Build](./api/#build)

::: info
Code splitting is still a work in progress. It currently only works with the `esm` output [format](./api/#format). There is also a known [ordering issue](https://github.com/evanw/esbuild/issues/399) with `import` statements across code splitting chunks. You can follow [the tracking issue](https://github.com/evanw/esbuild/issues/16) for updates about this feature.
:::

This enables "code splitting" which serves two purposes:

- Code shared between multiple entry points is split off into a separate shared file that both entry points import. That way if the user first browses to one page and then to another page, they don't have to download all of the JavaScript for the second page from scratch if the shared part has already been downloaded and cached by their browser.

- Code referenced through an asynchronous `import()` expression will be split off into a separate file and only loaded when that expression is evaluated. This allows you to improve the initial download time of your app by only downloading the code you need at startup, and then lazily downloading additional code if needed later.

  Without code splitting enabled, an `import()` expression becomes `Promise.resolve().then(() => require())` instead. This still preserves the asynchronous semantics of the expression but it means the imported code is included in the same bundle instead of being split off into a separate file.

When you enable code splitting you must also configure the output directory using the [outdir](./api/#outdir) setting:

::: code-group

```bash [CLI]
esbuild home.ts about.ts --bundle --splitting --outdir=out --format=esm
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['home.ts', 'about.ts'],
  bundle: true,
  splitting: true,
  outdir: 'out',
  format: 'esm',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"home.ts", "about.ts"},
    Bundle:      true,
    Splitting:   true,
    Outdir:      "out",
    Format:      api.FormatESModule,
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

## Output location

### Allow overwrite

> Supported by: [Build](./api/#build)

Enabling this setting allows output files to overwrite input files. It's not enabled by default because doing so means overwriting your source code, which can lead to data loss if your code is not checked in. But supporting this makes certain workflows easier by avoiding the need for a temporary directory. So you can enable this when you want to deliberately overwrite your source code:

::: code-group

```bash [CLI]
esbuild app.js --outdir=. --allow-overwrite
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  outdir: '.',
  allowOverwrite: true,
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:    []string{"app.js"},
    Outdir:         ".",
    AllowOverwrite: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Asset names

> Supported by: [Build](./api/#build)

This option controls the file names of the additional output files generated when the [loader](./api/#loader) is set to [`file`](./content-types/#external-file). It configures the output paths using a template with placeholders that will be substituted with values specific to the file when the output path is generated. For example, specifying an asset name template of `assets/[name]-[hash]` puts all assets into a subdirectory called `assets` inside of the output directory and includes the content hash of the asset in the file name. Doing that looks like this:

::: code-group

```bash [CLI]
esbuild app.js --asset-names=assets/[name]-[hash] --loader:.png=file --bundle --outdir=out
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  assetNames: 'assets/[name]-[hash]',
  loader: { '.png': 'file' },
  bundle: true,
  outdir: 'out',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    AssetNames:  "assets/[name]-[hash]",
    Loader: map[string]api.Loader{
      ".png": api.LoaderFile,
    },
    Bundle: true,
    Outdir: "out",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

There are four placeholders that can be used in asset path templates:

- `[dir]`

  This is the relative path from the directory containing the asset file to the [outbase](./api/#outbase) directory. Its purpose is to help asset output paths look more aesthetically pleasing by mirroring the input directory structure inside of the output directory.

- `[name]`

  This is the original file name of the asset without the extension. For example, if the asset was originally named `image.png` then `[name]` will be substituted with `image` in the template. It is not necessary to use this placeholder; it only exists to provide human-friendly asset names to make debugging easier.

- `[hash]`

  This is the content hash of the asset, which is useful to avoid name collisions. For example, your code may import `components/button/icon.png` and `components/select/icon.png` in which case you'll need the hash to distinguish between the two assets that are both named `icon`.

- `[ext]`

  This is the file extension of the asset (i.e. everything after the end of the last `.` character). It can be used to put different types of assets into different directories. For example, `--asset-names=assets/[ext]/[name]-[hash]` might write out an asset named `image.png` as `assets/png/image-CQFGD2NG.png`.

Asset path templates do not need to include a file extension. The original file extension of the asset will be automatically added to the end of the output path after template substitution.

This option is similar to the [chunk names](./api/#chunk-names) and [entry names](./api/#entry-names) options.

### Chunk names

> Supported by: [Build](./api/#build)

This option controls the file names of the chunks of shared code that are automatically generated when [code splitting](./api/#splitting) is enabled. It configures the output paths using a template with placeholders that will be substituted with values specific to the chunk when the output path is generated. For example, specifying a chunk name template of `chunks/[name]-[hash]` puts all generated chunks into a subdirectory called chunks inside of the output directory and includes the content hash of the chunk in the file name. Doing that looks like this:

::: code-group

```bash [CLI]
esbuild app.js --chunk-names=chunks/[name]-[hash] --bundle --outdir=out --splitting --format=esm
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  chunkNames: 'chunks/[name]-[hash]',
  bundle: true,
  outdir: 'out',
  splitting: true,
  format: 'esm',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    ChunkNames:  "chunks/[name]-[hash]",
    Bundle:      true,
    Outdir:      "out",
    Splitting:   true,
    Format:      api.FormatESModule,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

There are three placeholders that can be used in chunk path templates:

- `[name]`

  This will currently always be the text `chunk`, although this placeholder may take on additional values in future releases.

- `[hash]`

  This is the content hash of the chunk. Including this is necessary to distinguish different chunks from each other in the case where multiple chunks of shared code are generated.

- `[ext]`

  This is the file extension of the chunk (i.e. everything after the end of the last . character). It can be used to put different types of chunks into different directories. For example, `--chunk-names=chunks/[ext]/[name]-[hash]` might write out a chunk as `chunks/css/chunk-DEFJT7KY.css`.

Chunk path templates do not need to include a file extension. The configured [out extension](./api/#out-extension) for the appropriate content type will be automatically added to the end of the output path after template substitution.

Note that this option only controls the names for automatically-generated chunks of shared code. It does not control the names for output files related to entry points. The names of these are currently determined from the path of the original entry point file relative to the [outbase](./api/#outbase) directory, and this behavior cannot be changed. An additional API option will be added in the future to let you change the file names of entry point output files.

This option is similar to the [asset names](./api/#asset-names) and [entry names](./api/#entry-names) options.

### Entry names

> Supported by: [Build](./api/#build)

This option controls the file names of the output files corresponding to each input entry point file. It configures the output paths using a template with placeholders that will be substituted with values specific to the file when the output path is generated. For example, specifying an entry name template of `[dir]/[name]-[hash]` includes a hash of the output file in the file name and puts the files into the output directory, potentially under a subdirectory (see the details about `[dir]` below). Doing that looks like this:

::: code-group

```bash [CLI]
esbuild src/main-app/app.js --entry-names=[dir]/[name]-[hash] --outbase=src --bundle --outdir=out
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/main-app/app.js'],
  entryNames: '[dir]/[name]-[hash]',
  outbase: 'src',
  bundle: true,
  outdir: 'out',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"src/main-app/app.js"},
    EntryNames:  "[dir]/[name]-[hash]",
    Outbase:     "src",
    Bundle:      true,
    Outdir:      "out",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

There are four placeholders that can be used in entry path templates:

- `[dir]`

  This is the relative path from the directory containing the input entry point file to the [outbase](./api/#outbase) directory. Its purpose is to help you avoid collisions between identically-named entry points in different subdirectories.

  For example, if there are two entry points `src/pages/home/index.ts` and `src/pages/about/index.ts`, the outbase directory is `src`, and the entry names template is `[dir]/[name]`, the output directory will contain `pages/home/index.js` and `pages/about/index.js`. If the entry names template had been just `[name]` instead, bundling would have failed because there would have been two output files with the same output path `index.js` inside the output directory.

- `[name]`

  This is the original file name of the entry point without the extension. For example, if the input entry point file is named `app.js` then `[name]` will be substituted with `app` in the template.

- `[hash]`

  This is the content hash of the output file, which can be used to take optimal advantage of browser caching. Adding `[hash]` to your entry point names means esbuild will calculate a hash that relates to all content in the corresponding output file (and any output file it imports if [code splitting](./api/#splitting) is active). The hash is designed to change if and only if any of the input files relevant to that output file are changed.

  After that, you can have your web server tell browsers that to cache these files forever (in practice you can say they expire a very long time from now such as in a year). You can then use the information in the [metafile](./api/#metafile) to determine which output file path corresponds to which input entry point so you know what path to include in your `<script>` tag.

- `[ext]`

  This is the file extension that the entry point file will be written out to (i.e. the [out extension](./api/#out-extension) setting, not the original file extension). It can be used to put different types of entry points into different directories. For example, `--entry-names=entries/[ext]/[name]` might write the output file for `app.ts` to `entries/js/app.js`.

Entry path templates do not need to include a file extension. The appropriate [out extension](./api/#out-extension) based on the file type will be automatically added to the end of the output path after template substitution.

This option is similar to the [asset names](./api/#asset-names) and [entry names](./api/#entry-names) options.

### Out extension

> Supported by: [Build](./api/#build)

This option lets you customize the file extension of the files that esbuild generates to something other than `.js` or `.css`. In particular, the `.mjs` and `.cjs` file extensions have special meaning in node (they indicate a file in ESM and CommonJS format, respectively). This option is useful if you are using esbuild to generate multiple files and you have to use the [outdir](./api/#outdir) option instead of the [outfile](./api/#outfile) option. You can use it like this:

::: code-group

```bash [CLI]
esbuild app.js --bundle --outdir=dist --out-extension:.js=.mjs
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
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
    Outdir:      "dist",
    OutExtension: map[string]string{
      ".js": ".mjs",
    },
    Write: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Outbase

> Supported by: [Build](./api/#build)

If your build contains multiple entry points in separate directories, the directory structure will be replicated into the [output directory](./api/#outdir) relative to the outbase directory. For example, if there are two entry points `src/pages/home/index.ts` and `src/pages/about/index.ts` and the outbase directory is `src`, the output directory will contain `pages/home/index.js` and `pages/about/index.js`. Here's how to use it:

::: code-group

```bash [CLI]
esbuild src/pages/home/index.ts src/pages/about/index.ts --bundle --outdir=out --outbase=src
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'src/pages/home/index.ts',
    'src/pages/about/index.ts',
  ],
  bundle: true,
  outdir: 'out',
  outbase: 'src',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{
      "src/pages/home/index.ts",
      "src/pages/about/index.ts",
    },
    Bundle:  true,
    Outdir:  "out",
    Outbase: "src",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

If the outbase directory isn't specified, it defaults to the [lowest common ancestor](https://en.wikipedia.org/wiki/Lowest_common_ancestor) directory among all input entry point paths. This is `src/pages` in the example above, which means by default the output directory will contain `home/index.js` and `about/index.js` instead.

### Outdir

> Supported by: [Build](./api/#build)

This option sets the output directory for the build operation. For example, this command will generate a directory called `out`:

::: code-group

```bash [CLI]
esbuild app.js --bundle --outdir=out
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  outdir: 'out',
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
    Outdir:      "out",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

The output directory will be generated if it does not already exist, but it will not be cleared if it already contains some files. Any generated files will silently overwrite existing files with the same name. You should clear the output directory yourself before running esbuild if you want the output directory to only contain files from the current run of esbuild.

If your build contains multiple entry points in separate directories, the directory structure will be replicated into the output directory starting from the [lowest common ancestor](https://en.wikipedia.org/wiki/Lowest_common_ancestor) directory among all input entry point paths. For example, if there are two entry points `src/home/index.ts` and `src/about/index.ts`, the output directory will contain `home/index.js` and `about/index.js`. If you want to customize this behavior, you should change the [outbase directory](./api/#outbase).

### Outfile

> Supported by: [Build](./api/#build)

This option sets the output file name for the build operation. This is only applicable if there is a single entry point. If there are multiple entry points, you must use the [outdir](./api/#outdir) option instead to specify an output directory. Using outfile looks like this:

::: code-group

```bash [CLI]
esbuild app.js --bundle --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
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
    Outdir:      "out.js",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Public path

> Supported by: [Build](./api/#build)

This is useful in combination with the [external file](./content-types/#external-file) loader. By default that loader exports the name of the imported file as a string using the `default` export. The public path option lets you prepend a base path to the exported string of each file loaded by this loader:

::: code-group

```bash [CLI]
esbuild app.js --bundle --loader:.png=file --public-path=https://www.example.com/v1 --outdir=out
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  loader: { '.png': 'file' },
  publicPath: 'https://www.example.com/v1',
  outdir: 'out',
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
    Loader: map[string]api.Loader{
      ".png": api.LoaderFile,
    },
    Outdir:     "out",
    PublicPath: "https://www.example.com/v1",
    Write:      true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Write

> Supported by: [Build](./api/#build)

The build API call can either write to the file system directly or return the files that would have been written as in-memory buffers. By default the CLI and JavaScript APIs write to the file system and the Go API doesn't. To use the in-memory buffers:

::: code-group

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.js'],
  sourcemap: 'external',
  write: false,
  outdir: 'out',
})

for (let out of result.outputFiles) {
  console.log(out.path, out.contents, out.text)
}
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Sourcemap:   api.SourceMapExternal,
    Write:       false,
    Outdir:      "out",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }

  for _, out := range result.OutputFiles {
    fmt.Printf("%v %v\n", out.Path, out.Contents)
  }
}
```

:::

## Path resolution

### Alias

> Supported by: [Build](./api/#build)

This feature lets you substitute one package for another when bundling. The example below substitutes the package `oldpkg` with the package `newpkg`:

::: code-group

```bash [CLI]
esbuild app.js --bundle --alias:oldpkg=newpkg
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  write: true,
  alias: {
    'oldpkg': 'newpkg',
  },
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
    Write:       true,
    Alias: map[string]string{
      "oldpkg": "newpkg",
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

These new substitutions happen first before all of esbuild's other path resolution logic. One use case for this feature is replacing a node-only package with a browser-friendly package in third-party code that you don't control.

Note that when an import path is substituted using an alias, the resulting import path is resolved in the working directory instead of in the directory containing the source file with the import path. If needed, the working directory that esbuild uses can be set with the [working directory](./api/#working-directory) feature.

### Conditions

> Supported by: [Build](./api/#build)

This feature controls how the `exports` field in `package.json` is interpreted. Custom conditions can be added using the conditions setting. You can specify as many of these as you want and the meaning of these is entirely up to package authors. Node has currently only endorsed the `development` and `production` custom conditions for recommended use. Here is an example of adding the custom conditions `custom1` and `custom2`:

::: code-group

```bash [CLI]
esbuild src/app.js --bundle --conditions=custom1,custom2
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/app.js'],
  bundle: true,
  conditions: ['custom1', 'custom2'],
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"src/app.js"},
    Bundle:      true,
    Conditions:  []string{"custom1", "custom2"},
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

#### How conditions work

Conditions allow you to redirect the same import path to different file locations in different situations. The redirect map containing the conditions and paths is stored in the `exports` field in the package's `package.json` file. For example, this would remap `require('pkg/foo')` to `pkg/required.cjs` and `import 'pkg/foo'` to `pkg/imported.mjs` using the `import` and `require` conditions:

```json
{
  "name": "pkg",
  "exports": {
    "./foo": {
      "import": "./imported.mjs",
      "require": "./required.cjs",
      "default": "./fallback.js"
    }
  }
}
```

Conditions are checked in the order that they appear within the JSON file. So the example above behaves sort of like this:

```js
if (importPath === './foo') {
  if (conditions.has('import')) return './imported.mjs'
  if (conditions.has('require')) return './required.cjs'
  return './fallback.js'
}
```

By default there are five conditions with special behavior that are built in to esbuild, and cannot be disabled:

- `default`

  This condition is always active. It is intended to come last and lets you provide a fallback for when no other condition applies. This condition is also active when you run your code natively in node.

- `import`

  This condition is only active when the import path is from an ESM `import` statement or `import()` expression. It can be used to provide ESM-specific code. This condition is also active when you run your code natively in node (but only in an ESM context).

- `require`

  This condition is only active when the import path is from a CommonJS `require()` call. It can be used to provide CommonJS-specific code. This condition is also active when you run your code natively in node (but only in a CommonJS context).

- `browser`

  This condition is only active when esbuild's [platform](./api/#platform) setting is set to `browser`. It can be used to provide browser-specific code. This condition is not active when you run your code natively in node.

- `node`

  This condition is only active when esbuild's [platform](./api/#platform) setting is set to `node`. It can be used to provide node-specific code. This condition is also active when you run your code natively in node.

The following condition is also automatically included when the [platform](./api/#platform) is set to either `browser` or `node` and no custom conditions are configured. If there are any custom conditions configured (even an empty list) then this condition will no longer be automatically included:

- module

  This condition can be used to tell esbuild to pick the ESM variant for a given import path to provide better tree-shaking when bundling. This condition is not active when you run your code natively in node. It is specific to bundlers, and originated from Webpack.

Note that when you use the `require` and `import` conditions, *your package may end up in the bundle multiple times!* This is a subtle issue that can cause bugs due to duplicate copies of your code's state in addition to bloating the resulting bundle. This is commonly known as the [dual package hazard](https://nodejs.org/docs/latest/api/packages.html#packages_dual_package_hazard).

One way of avoiding the dual package hazard that works both for bundlers and when running natively in node is to put all of your code in the `require` condition as CommonJS and have the `import` condition just be a light ESM wrapper that calls `require` on your package and re-exports the package using ESM syntax. This approach doesn't provide good tree-shaking, however, as esbuild doesn't tree-shake CommonJS modules.

Another way of avoiding a dual package hazard is to use the bundler-specific `module` condition to direct bundlers to always load the ESM version of your package while letting node always fall back to the CommonJS version of your package. Both `import` and `module` are intended to be used with ESM but unlike `import`, the `module` condition is always active even if the import path was loaded using a `require` call. This works well with bundlers because bundlers support loading ESM using `require`, but it's not something that can work with node because node deliberately doesn't implement loading ESM using `require`.

### External

> Supported by: [Build](./api/#build)

You can mark a file or a package as external to exclude it from your build. Instead of being bundled, the import will be preserved (using `require` for the `iife` and `cjs` formats and using `import` for the `esm` format) and will be evaluated at run time instead.

This has several uses. First of all, it can be used to trim unnecessary code from your bundle for a code path that you know will never be executed. For example, a package may contain code that only runs in node but you will only be using that package in the browser. It can also be used to import code in node at run time from a package that cannot be bundled. For example, the `fsevents` package contains a native extension, which esbuild doesn't support. Marking something as external looks like this:

::: code-group

```bash [CLI] $(1,3)
echo 'require("fsevents")' > app.js

esbuild app.js --bundle --external:fsevents --platform=node
// app.js
require("fsevents");
```

```js [JS]
import * as esbuild from 'esbuild'
import fs from 'node:fs'

fs.writeFileSync('app.js', 'require("fsevents")')

await esbuild.build({
  entryPoints: ['app.js'],
  outfile: 'out.js',
  bundle: true,
  platform: 'node',
  external: ['fsevents'],
})
```

```go [Go]
package main

import "io/ioutil"
import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  ioutil.WriteFile("app.js", []byte("require(\"fsevents\")"), 0644)

  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Outfile:     "out.js",
    Bundle:      true,
    Write:       true,
    Platform:    api.PlatformNode,
    External:    []string{"fsevents"},
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

You can also use the `*` wildcard character in an external path to mark all files matching that pattern as external. For example, you can use `*.png` to remove all `.png` files or `/images/*` to remove all paths starting with `/images/`:

::: code-group

```bash [CLI]
esbuild app.js --bundle "--external:*.png" "--external:/images/*"
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  outfile: 'out.js',
  bundle: true,
  external: ['*.png', '/images/*'],
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Outfile:     "out.js",
    Bundle:      true,
    Write:       true,
    External:    []string{"*.png", "/images/*"},
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

External paths are applied both before and after path resolution, which lets you match against both the import path in the source code and the absolute file system path. The path is considered to be external if the external path matches in either case. The specific behavior is as follows:

- Before path resolution begins, import paths are checked against all external paths. In addition, if the external path looks like a package path (i.e. doesn't start with `/` or `./` or `../`), import paths are checked to see if they have that package path as a path prefix.

  This means that `--external:@foo/bar` implicitly also means `--external:@foo/bar/*` which matches the import path `@foo/bar/baz`. So it marks all paths inside the `@foo/bar` package as external too.

- After path resolution ends, the resolved absolute paths are checked against all external paths that don't look like a package path (i.e. those that start with `/` or `./` or `../`). But before checking, the external path is joined with the current working directory and then normalized, becoming an absolute path (even if it contains a `*` wildcard character).

  This means that you can mark everything in the directory dir as external using `--external:./dir/*`. Note that the leading `./` is important. Using `--external:dir/*` instead is treated as a package path and is not checked for after path resolution ends.

### Main fields

> Supported by: [Build](./api/#build)

When you import a package in node, the `main` field in that package's `package.json` file determines which file is imported (along with [a lot of other rules](https://nodejs.org/api/modules.html#all-together)). Major JavaScript bundlers including esbuild let you specify additional `package.json` fields to try when resolving a package. There are at least three such fields commonly in use:

- `main`

  This is [the standard field](https://docs.npmjs.com/files/package.json#main) for all packages that are meant to be used with node. The name `main` is hard-coded in to node's module resolution logic itself. Because it's intended for use with node, it's reasonable to expect that the file path in this field is a CommonJS-style module.

- `module`

  This field came from [a proposal](https://github.com/dherman/defense-of-dot-js/blob/f31319be735b21739756b87d551f6711bd7aa283/proposal.md) for how to integrate ECMAScript modules into node. Because of this, it's reasonable to expect that the file path in this field is an ECMAScript-style module. This proposal wasn't adopted by node (node uses `"type": "module"` instead) but it was adopted by major bundlers because ECMAScript-style modules lead to better [tree shaking](./api/#tree-shaking), or dead code removal.

  For package authors: Some packages incorrectly use the `module` field for browser-specific code, leaving node-specific code for the `main` field. This is probably because node ignores the `module` field and people typically only use bundlers for browser-specific code. However, bundling node-specific code is valuable too (e.g. it decreases download and boot time) and packages that put browser-specific code in module `prevent` bundlers from being able to do tree shaking effectively. If you are trying to publish browser-specific code in a package, use the `browser` field instead.

- `browser`

  This field came from [a proposal](https://gist.github.com/defunctzombie/4339901/49493836fb873ddaa4b8a7aa0ef2352119f69211) that allows bundlers to replace node-specific files or modules with their browser-friendly versions. It lets you specify an alternate browser-specific entry point. Note that it is possible for a package to use both the `browser` and `module` field together (see the note below).

The default main fields depend on the current [platform](./api/#platform) setting. These defaults should be the most widely compatible with the existing package ecosystem. But you can customize them like this if you want to:

::: code-group

```bash [CLI]
esbuild app.js --bundle --main-fields=module,main
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  mainFields: ['module', 'main'],
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
    MainFields:  []string{"module", "main"},
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

#### For package authors

If you want to author a package that uses the `browser` field in combination with the `module` field, then you'll probably want to fill _**out all four entries**_ in the full CommonJS-vs-ESM and browser-vs-node compatibility matrix. For that you'll need to use the expanded form of the `browser` field that is a map instead of just a string:

```json
{
  "main": "./node-cjs.js",
  "module": "./node-esm.js",
  "browser": {
    "./node-cjs.js": "./browser-cjs.js",
    "./node-esm.js": "./browser-esm.js"
  }
}
```

The `main` field is expected to be CommonJS while the `module` field is expected to be ESM. The decision about which module format to use is independent from the decision about whether to use a browser-specific or node-specific variant. If you omit one of these four entries, then you risk the wrong variant being chosen. For example, if you omit the entry for the CommonJS browser build, then the CommonJS node build could be chosen instead.

Note that using `main`, `module`, and `browser` is the old way of doing this. There is also a newer way to do this that you may prefer to use instead: the [`exports` field](./api/#how-conditions-work) in `package.json`. It provides a different set of trade-offs. For example, it gives you more precise control over imports for all sub-paths in your package (while `main` fields only give you control over the entry point), but it may cause your package to be imported multiple times depending on how you configure it.

### Node paths

> Supported by: [Build](./api/#build)

Node's module resolution algorithm supports an environment variable called [`NODE_PATH`](https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders) that contains a list of global directories to use when resolving import paths. These paths are searched for packages in addition to the `node_modules` directories in all parent directories. You can pass this list of directories to esbuild using an environment variable with the CLI and using an array with the JS and Go APIs:

::: code-group

```bash [CLI]
NODE_PATH=someDir esbuild app.js --bundle --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  nodePaths: ['someDir'],
  entryPoints: ['app.js'],
  bundle: true,
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    NodePaths:   []string{"someDir"},
    EntryPoints: []string{"app.js"},
    Bundle:      true,
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

If you are using the CLI and want to pass multiple directories using `NODE_PATH`, you will have to separate them with `:` on Unix and `;` on Windows. This is the same format that Node itself uses.

### Packages

> Supported by: [Build](./api/#build)

Use this setting to exclude all of your package's dependencies from the bundle. This is useful when [bundling for node](./getting-started/#bundling-for-node) because many npm packages use node-specific features that esbuild doesn't support while bundling (such as `__dirname`, `import.meta.url`, `fs.readFileSync`, and `*.node` native binary modules). Using it looks like this:

::: code-group

```bash [CLI]
esbuild app.js --bundle --packages=external
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  packages: 'external',
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
    Packages:    api.PackagesExternal,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::


Enabling this automatically marks all import paths that look like npm packages (i.e. that don't start with a `.` or `..` path component and that aren't absolute paths) as external. It has the same effect as manually passing each dependency to [external](./api/#external) but is more concise. If you want to customize which of your dependencies are external and which ones aren't, then you should be using [external](./api/#external) instead of this setting.

Note that this setting only has an effect when [bundling](./api/#bundle) is enabled. Also note that marking an import path as external happens after the import path is rewritten by any configured [aliases](./api/#alias), so the alias feature still has an effect when this setting is used.

### Preserve symlinks

> Supported by: [Build](./api/#build)

This setting mirrors the [`--preserve-symlinks`](https://nodejs.org/api/cli.html#cli_preserve_symlinks) setting in node. If you use that setting (or the similar [`resolve.symlinks`](https://webpack.js.org/configuration/resolve/#resolvesymlinks) setting in Webpack), you will likely need to enable this setting in esbuild too. It can be enabled like this:

::: code-group

```bash [CLI]
esbuild app.js --bundle --preserve-symlinks --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  preserveSymlinks: true,
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:      []string{"app.js"},
    Bundle:           true,
    PreserveSymlinks: true,
    Outfile:          "out.js",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Enabling this setting causes esbuild to determine file identity by the original file path (i.e. the path without following symlinks) instead of the real file path (i.e. the path after following symlinks). This can be beneficial with certain directory structures. Keep in mind that this means a file may be given multiple identities if there are multiple symlinks pointing to it, which can result in it appearing multiple times in generated output files.

*Note: The term "symlink" means [symbolic link](https://en.wikipedia.org/wiki/Symbolic_link) and refers to a file system feature where a path can redirect to another path.*

### Resolve extensions

> Supported by: [Build](./api/#build)

The [resolution algorithm used by node](https://nodejs.org/api/modules.html#modules_file_modules) supports implicit file extensions. You can `require('./file')` and it will check for `./file`, `./file.js`, `./file.json`, and `./file.node` in that order. Modern bundlers including esbuild extend this concept to other file types as well. The full order of implicit file extensions in esbuild can be customized using the resolve extensions setting, which defaults to `.tsx,.ts,.jsx,.js,.css,.json`:

::: code-group

```bash [CLI]
esbuild app.js --bundle --resolve-extensions=.ts,.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  resolveExtensions: ['.ts', '.js'],
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:       []string{"app.js"},
    Bundle:            true,
    ResolveExtensions: []string{".ts", ".js"},
    Write:             true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Note that esbuild deliberately does not include the new `.mjs` and `.cjs` extensions in this list. Node's resolution algorithm doesn't treat these as implicit file extensions, so esbuild doesn't either. If you want to import files with these extensions you should either explicitly add the extensions in your import paths or change this setting to include the additional extensions that you want to be implicit.

### Working directory

> Supported by: [Build](./api/#build)

This API option lets you specify the working directory to use for the build. It normally defaults to the current [working directory](https://en.wikipedia.org/wiki/Working_directory) of the process you are using to call esbuild's API. The working directory is used by esbuild for a few different things including resolving relative paths given as API options to absolute paths and pretty-printing absolute paths as relative paths in log messages. Here is how to customize esbuild's working directory:

::: code-group

```bash [CLI]
cd "/var/tmp/custom/working/directory"
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['file.js'],
  absWorkingDir: '/var/tmp/custom/working/directory',
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:   []string{"file.js"},
    AbsWorkingDir: "/var/tmp/custom/working/directory",
    Outfile:       "out.js",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Note: If you are using [Yarn Plug'n'Play](https://yarnpkg.com/features/pnp/), keep in mind that this working directory is used to search for Yarn's manifest file. If you are running esbuild from an unrelated directory, you will have to set this working directory to the directory containing the manifest file (or one of its child directories) for the manifest file to be found by esbuild.

## Transformation

### JSX

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This option tells esbuild what to do about JSX syntax. Here are the available options:

- `transform`

  This tells esbuild to transform JSX to JS using a general-purpose transform that's shared between many libraries that use JSX syntax. Each JSX element is turned into a call to the [JSX factory](./api/#jsx-factory) function with the element's component (or with the [JSX fragment](./api/#jsx-fragment) for fragments) as the first argument. The second argument is an array of props (or `null` if there are no props). Any child elements present become additional arguments after the second argument.

  If you want to configure this setting on a per-file basis, you can do that by using a `// @jsxRuntime classic` comment. This is a convention from [Babel's JSX plugin](https://babeljs.io/docs/en/babel-preset-react/) that esbuild follows.

- `preserve`

  This preserves the JSX syntax in the output instead of transforming it into function calls. JSX elements are treated as first-class syntax and are still affected by other settings such as [minification](./api/#minify) and [property mangling](./api/#mangle-props).

  Note that this means the output files are no longer valid JavaScript code. This feature is intended to be used when you want to transform the JSX syntax in esbuild's output files by another tool after bundling.

- `automatic`

  This transform was [introduced in React 17+](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) and is very specific to React. It automatically generates import statements from the [JSX import source](./api/#jsx-import-source) and introduces many special cases regarding how the syntax is handled. The details are too complicated to describe here. For more information, please read [React's documentation about their new JSX transform](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md). If you want to enable the development mode version of this transform, you need to additionally enable the [JSX dev](./api/#jsx-dev) setting.

  If you want to configure this setting on a per-file basis, you can do that by using a `// @jsxRuntime automatic` comment. This is a convention from [Babel's JSX plugin](https://babeljs.io/docs/en/babel-preset-react/) that esbuild follows.

Here's an example of setting the JSX transform to `preserve`:

::: code-group

```bash [CLI] $(1)
echo '<div/>' | esbuild --jsx=preserve --loader=jsx
<div />;
```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.transform('<div/>', {
  jsx: 'preserve',
  loader: 'jsx',
})

console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  result := api.Transform("<div/>", api.TransformOptions{
    JSX:    api.JSXPreserve,
    Loader: api.LoaderJSX,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

### JSX dev

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

If the [JSX](./api/#jsx) transform has been set to `automatic`, then enabling this setting causes esbuild to automatically inject the file name and source location into each JSX element. Your JSX library can then use this information to help with debugging. If the JSX transform has been set to something other than `automatic`, then this setting does nothing. Here's an example of enabling this setting:

::: code-group

```bash [CLI] $(1,5)
echo '<a/>' | esbuild --loader=jsx --jsx=automatic
import { jsx } from "react/jsx-runtime";
/* @__PURE__ */ jsx("a", {});

echo '<a/>' | esbuild --loader=jsx --jsx=automatic --jsx-dev
import { jsxDEV } from "react/jsx-dev-runtime";
/* @__PURE__ */ jsxDEV("a", {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 1,
  columnNumber: 1
}, this);
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  jsxDev: true,
  jsx: 'automatic',
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.jsx"},
    JSXDev:      true,
    JSX:         api.JSXAutomatic,
    Outfile:     "out.js",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### JSX factory

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This sets the function that is called for each JSX element. Normally a JSX expression such as this:

```html
<div>Example text</div>
```

is compiled into a function call to `React.createElement` like this:

```js
React.createElement("div", null, "Example text");
```

You can call something other than `React.createElement` by changing the JSX factory. For example, to call the function h instead (which is used by other libraries such as [Preact](https://preactjs.com/)):

::: code-group

```bash [CLI] $(1)
echo '<div/>' | esbuild --jsx-factory=h --loader=jsx
/* @__PURE__ */ h("div", null);
```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.transform('<div/>', {
  jsxFactory: 'h',
  loader: 'jsx',
})

console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  result := api.Transform("<div/>", api.TransformOptions{
    JSXFactory: "h",
    Loader:     api.LoaderJSX,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

Alternatively, if you are using TypeScript, you can just configure JSX for TypeScript by adding this to your `tsconfig.json` file and esbuild should pick it up automatically without needing to be configured:

```json
{
  "compilerOptions": {
    "jsxFactory": "h"
  }
}
```

If you want to configure this on a per-file basis, you can do that by using a `// @jsx h` comment. Note that this setting does not apply when the [JSX](./api/#jsx) transform has been set to `automatic`.

### JSX fragment

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This sets the function that is called for each JSX fragment. Normally a JSX fragment expression such as this:

```
<>Stuff</>
```

is compiled into a use of the `React.Fragment` component like this:

```js
React.createElement(React.Fragment, null, "Stuff");
```

You can use a component other than `React.Fragment` by changing the JSX fragment. For example, to use the component `Fragment` instead (which is used by other libraries such as [Preact](https://preactjs.com/)):

::: code-group

```bash [CLI] $(1)
echo '<>x</>' | esbuild --jsx-fragment=Fragment --loader=jsx
/* @__PURE__ */ React.createElement(Fragment, null, "x");
```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.transform('<>x</>', {
  jsxFragment: 'Fragment',
  loader: 'jsx',
})

console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  result := api.Transform("<>x</>", api.TransformOptions{
    JSXFragment: "Fragment",
    Loader:      api.LoaderJSX,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

Alternatively, if you are using TypeScript, you can just configure JSX for TypeScript by adding this to your `tsconfig.json` file and esbuild should pick it up automatically without needing to be configured:

```json
{
  "compilerOptions": {
    "jsxFragmentFactory": "Fragment"
  }
}
```

f you want to configure this on a per-file basis, you can do that by using a `// @jsxFrag Fragment` comment. Note that this setting does not apply when the [JSX](./api/#jsx) transform has been set to `automatic`.

### JSX import source

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

If the [JSX](./api/#jsx) transform has been set to `automatic`, then setting this lets you change which library esbuild uses to automatically import its JSX helper functions from. Note that this only works with the JSX transform that's [specific to React 17+](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html). If you set the JSX import source to your-pkg, then that package must expose at least the following exports:

```js
import { createElement } from "your-pkg"
import { Fragment, jsx, jsxs } from "your-pkg/jsx-runtime"
import { Fragment, jsxDEV } from "your-pkg/jsx-dev-runtime"
```

The `/jsx-runtime` and `/jsx-dev-runtime` subpaths are hard-coded by design and cannot be changed. The `jsx` and `jsxs` imports are used when [JSX dev mode](./api/#jsx-dev) is off and the `jsxDEV` import is used when JSX dev mode is on. The meaning of these is described in [React's documentation about their new JSX transform](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md). The `createElement` import is used regardless of the JSX dev mode when an element has a prop spread followed by a `key` prop, which looks like this:

```
return <div {...props} key={key} />
```

Here's an example of setting the JSX import source to [preact](https://preactjs.com/):

::: code-group

```bash [CLI]
esbuild app.jsx --jsx-import-source=preact --jsx=automatic
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  jsxImportSource: 'preact',
  jsx: 'automatic',
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:     []string{"app.jsx"},
    JSXImportSource: "preact",
    JSX:             api.JSXAutomatic,
    Outfile:         "out.js",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Alternatively, if you are using TypeScript, you can just configure the JSX import source for TypeScript by adding this to your `tsconfig.json` file and esbuild should pick it up automatically without needing to be configured:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

And if you want to control this setting on the per-file basis, you can do that with a `// @jsxImportSource your-pkg` comment in each file. You may also need to add a `// @jsxRuntime automatic` comment as well if the [JSX](./api/#jsx) transform has not already been set by other means, or if you want that to be set on a per-file basis as well.

### JSX side effects

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

By default esbuild assumes that JSX expressions are side-effect free, which means they are annoated with [`/* @__PURE__ */` comments](./api/#pure) and are removed during bundling when they are unused. This follows the common use of JSX for virtual DOM and applies to the vast majority of JSX libraries. However, some people have written JSX libraries that don't have this property (specifically JSX expressions can have arbitrary side effects and can't be removed when unused). If you are using such a library, you can use this setting to tell esbuild that JSX expressions have side effects:

::: code-group

```bash [CLI]
esbuild app.jsx --jsx-side-effects
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  outfile: 'out.js',
  jsxSideEffects: true,
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:    []string{"app.jsx"},
    Outfile:        "out.js",
    JSXSideEffects: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Supported

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This setting lets you customize esbuild's set of unsupported syntax features at the individual syntax feature level. For example, you can use this to tell esbuild that [BigInts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) are not supported so that esbuild generates an error when you try to use one. Usually this is configured for you when you use the `target` setting, which you should typically be using instead of this setting. If the target is specified in addition to this setting, this setting will override whatever is specified by the target.

Here are some examples of why you might want to use this setting instead of or in addition to setting the target:

- JavaScript runtimes often do a quick implementation of newer syntax features that is slower than the equivalent older JavaScript, and you can get a speedup by telling esbuild to pretend this syntax feature isn't supported. For example, [V8](https://v8.dev/) has a [long-standing performance bug regarding object spread](https://bugs.chromium.org/p/v8/issues/detail?id=11536) that can be avoided by manually copying properties instead of using object spread syntax.

- There are many other JavaScript implementations in addition to the ones that esbuild's `target` setting recognizes, and they may not support certain features. If you are targeting such an implementation, you can use this setting to configure esbuild with a custom syntax feature compatibility set without needing to change esbuild itself. For example, [TypeScript's](https://www.typescriptlang.org/) JavaScript parser may not support [arbitrary module namespace identifier names](https://github.com/microsoft/TypeScript/issues/40594) so you may want to turn those off when targeting TypeScript's JavaScript parser.

- You may be processing esbuild's output with another tool, and you may want esbuild to transform certain features and the other tool to transform certain other features. For example, if you are using esbuild to transform files individually to ES5 but you are then feeding the output into [Webpack](https://webpack.js.org/) for bundling, you may want to preserve `import()` expressions even though they are a syntax error in ES5.

If you want esbuild to consider a certain syntax feature to be unsupported, you can specify that like this:

::: code-group

```bash [CLI]
esbuild app.js --supported:bigint=false
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  supported: {
    'bigint': false,
  },
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Supported: map[string]bool{
      "bigint": false,
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Syntax features are specified using esbuild-specific feature names. The full set of feature names is as follows:

**JavaScript:**

- `arbitrary-module-namespace-names`
- `array-spread`
- `arrow`
- `async-await`
- `async-generator`
- `bigint`
- `class-field`
- `class-private-accessor`
- `class-private-brand-check`
- `class-private-field`
- `class-private-method`
- `class-private-static-accessor`
- `class-private-static-field`
- `class-private-static-method`
- `class-static-blocks`
- `class-static-field`
- `class`
- `const-and-let`
- `default-argument`
- `destructuring`
- `dynamic-import`
- `exponent-operator`
- `export-star-as`
- `for-await`
- `for-of`
- `generator`
- `hashbang`
- `import-assertions`
- `import-meta`
- `inline-script`
- `logical-assignment`
- `nested-rest-binding`
- `new-target`
- `node-colon-prefix-import`
- `node-colon-prefix-require`
- `nullish-coalescing`
- `object-accessors`
- `object-extensions`
- `object-rest-spread`
- `optional-catch-binding`
- `optional-chain`
- `regexp-dot-all-flag`
- `regexp-lookbehind-assertions`
- `regexp-match-indices`
- `regexp-named-capture-groups`
- `regexp-sticky-and-unicode-flags`
- `regexp-unicode-property-escapes`
- `rest-argument`
- `template-literal`
- `top-level-await`
- `typeof-exotic-object-is-object`
- `unicode-escapes`

**CSS:**

- `hex-rgba`
- `inline-style`
- `inset-property`
- `modern-rgb-hsl`
- `nesting`
- `rebecca-purple`

### Target

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This sets the target environment for the generated JavaScript and/or CSS code. It tells esbuild to transform JavaScript syntax that is too new for these environments into older JavaScript syntax that will work in these environments. For example, the `??` operator was introduced in Chrome 80 so esbuild will convert it into an equivalent (but more verbose) conditional expression when targeting Chrome 79 or earlier.

Note that this is only concerned with syntax features, not APIs. It does not automatically add [polyfills](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill) for new APIs that are not used by these environments. You will have to explicitly import polyfills for the APIs you need (e.g. by importing `core-js`). Automatic polyfill injection is outside of esbuild's scope.

Each target environment is an environment name followed by a version number. The following environment names are currently supported:

- `chrome`
- `deno`
- `edge`
- `firefox`
- `hermes`
- `ie`
- `ios`
- `node`
- `opera`
- `rhino`
- `safari`

In addition, you can also specify JavaScript language versions such as `es2020`. The default target is `esnext` which means that by default, esbuild will assume all of the latest JavaScript and CSS features are supported. Here is an example that configures multiple target environments. You don't need to specify all of them; you can just specify the subset of target environments that your project cares about. You can also be more precise about version numbers if you'd like (e.g. `node12.19.0` instead of just `node12`):

::: code-group

```bash [CLI]
esbuild app.js --target=es2020,chrome58,edge16,firefox57,node12,safari11
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  target: [
    'es2020',
    'chrome58',
    'edge16',
    'firefox57',
    'node12',
    'safari11',
  ],
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
    Target:      api.ES2020,
    Engines: []api.Engine{
      {Name: api.EngineChrome, Version: "58"},
      {Name: api.EngineEdge, Version: "16"},
      {Name: api.EngineFirefox, Version: "57"},
      {Name: api.EngineNode, Version: "12"},
      {Name: api.EngineSafari, Version: "11"},
    },
    Write: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

You can refer to the [JavaScript loader](./content-types/#javascript) for the details about which syntax features were introduced with which language versions. Keep in mind that while JavaScript language versions such as `es2020` are identified by year, that is the year the specification is approved. It has nothing to do with the year all major browsers implement that specification which often happens earlier or later than that year.

If you use a syntax feature that esbuild doesn't yet have support for transforming to your current language target, esbuild will generate an error where the unsupported syntax is used. This is often the case when targeting the `es5` language version, for example, since esbuild only supports transforming most newer JavaScript syntax features to `es6`.

If you need to customize the set of supported syntax features at the individual feature level in addition to or instead of what `target` provides, you can do that with the [`supported`](./api/#supported) setting.

## Optimization

### Define

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This feature provides a way to replace global identifiers with constant expressions. It can be a way to change the behavior some code between builds without changing the code itself:

::: code-group

```bash [CLI] $(1,4)
echo 'hooks = DEBUG && require("hooks")' | esbuild --define:DEBUG=true
hooks = require("hooks");

echo 'hooks = DEBUG && require("hooks")' | esbuild --define:DEBUG=false
hooks = false;
```

```js [JS] $(1,3,5,10>)
import * as esbuild from 'esbuild'

let js = 'hooks = DEBUG && require("hooks")'

(await esbuild.transform(js, {
  define: { DEBUG: 'true' },
})).code
'hooks = require("hooks");\n'

(await esbuild.transform(js, {
  define: { DEBUG: 'false' },
})).code
'hooks = false;\n'
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "hooks = DEBUG && require('hooks')"

  result1 := api.Transform(js, api.TransformOptions{
    Define: map[string]string{"DEBUG": "true"},
  })

  if len(result1.Errors) == 0 {
    fmt.Printf("%s", result1.Code)
  }

  result2 := api.Transform(js, api.TransformOptions{
    Define: map[string]string{"DEBUG": "false"},
  })

  if len(result2.Errors) == 0 {
    fmt.Printf("%s", result2.Code)
  }
}
```

:::

Replacement expressions must either be a JSON object (null, boolean, number, string, array, or object) or a single identifier. Replacement expressions other than arrays and objects are substituted inline, which means that they can participate in constant folding. Array and object replacement expressions are stored in a variable and then referenced using an identifier instead of being substituted inline, which avoids substituting repeated copies of the value but means that the values don't participate in constant folding.

If you want to replace something with a string literal, keep in mind that the replacement value passed to esbuild must itself contain quotes. Omitting the quotes means the replacement value is an identifier instead:

::: code-group

```bash [CLI] $(1)
echo 'id, str' | esbuild --define:id=text --define:str=\"text\"
text, "text";
```

```js [JS] $(1,3)
import * as esbuild from 'esbuild'

(await esbuild.transform('id, str', {
  define: { id: 'text', str: '"text"' },
})).code
'text, "text";\n'
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  result := api.Transform("id, text", api.TransformOptions{
    Define: map[string]string{
      "id":  "text",
      "str": "\"text\"",
    },
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

If you're using the CLI, keep in mind that different shells have different rules for how to escape double-quote characters (which are necessary when the replacement value is a string). Use a `\"` backslash escape because it works in both bash and Windows command prompt. Other methods of escaping double quotes that work in bash such as surrounding them with single quotes will not work on Windows, since Windows command prompt does not remove the single quotes. This is relevant when using the CLI from a npm script in your `package.json` file, which people will expect to work on all platforms:

```json
{
  "scripts": {
    "build": "esbuild --define:process.env.NODE_ENV=\\\"production\\\" app.js"
  }
}
```

If you still run into cross-platform quote escaping issues with different shells, you will probably want to switch to using the [JavaScript API](./api/) instead. There you can use regular JavaScript syntax to eliminate cross-platform differences.

If you're looking for a more advanced form of the define feature that can replace an expression with something other than a constant (e.g. replacing a global variable with a shim), you may be able to use the similar [inject](./api/#inject) feature to do that.

### Drop

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This tells esbuild to edit your source code before building to drop certain constructs. There are currently two possible things that can be dropped:

- `debugger`

  Passing this flag causes all [`debugger` statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger) to be removed from the output. This is similar to the `drop_debugger: true` flag available in the popular [UglifyJS](https://github.com/mishoo/UglifyJS) and [Terser](https://github.com/terser/terser) JavaScript minifiers.

  JavaScript's `debugger` statements cause the active debugger to treat the statement as an automatically-configured breakpoint. Code containing this statement will automatically be paused when the debugger is open. If no debugger is open, the statement does nothing. Dropping these statements from your code just prevents the debugger from automatically stopping when your code runs.

  You can drop `debugger` statements like this:

::: code-group

```bash [CLI]
esbuild app.js --drop:debugger
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  drop: ['debugger'],
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Drop:        api.DropDebugger,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

- `console`

  Passing this flag causes all [`console` API calls](https://developer.mozilla.org/en-US/docs/Web/API/console#methods) to be removed from the output. This is similar to the `drop_console: true` flag available in the popular [UglifyJS](https://github.com/mishoo/UglifyJS) and [Terser](https://github.com/terser/terser) JavaScript minifiers.

  WARNING: Using this flag can introduce bugs into your code! This flag removes the entire call expression including all call arguments. If any of those arguments had important side effects, using this flag will change the behavior of your code. Be very careful when using this flag.

  If you want to remove console API calls without removing the arguments with side effects (so you do not introduce bugs), you should mark the relevant API calls as [pure](./api/#pure) instead. For example, you can mark `console.log` as pure using `--pure:console.log`. This will cause these API calls to be removed safely when minification is enabled.

  You can drop `console` API calls like this:

::: code-group

```bash [CLI]
esbuild app.js --drop:console
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  drop: ['console'],
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Drop:        api.DropConsole,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Ignore annotations

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

Since JavaScript is a dynamic language, identifying unused code is sometimes very difficult for a compiler, so the community has developed certain annotations to help tell compilers what code should be considered side-effect free and available for removal. Currently there are two forms of side-effect annotations that esbuild supports:

- Inline `/* @__PURE__ */` comments before function calls tell esbuild that the function call can be removed if the resulting value isn't used. See the [pure](./api/#pure) API option for more information.

- The `sideEffects` field in `package.json` can be used to tell esbuild which files in your package can be removed if all imports from that file end up being unused. This is a convention from Webpack and many libraries published to npm already have this field in their package definition. You can learn more about this field in [Webpack's documentation](https://webpack.js.org/guides/tree-shaking/) for this field.

These annotations can be problematic because the compiler depends completely on developers for accuracy, and developers occasionally publish packages with incorrect annotations. The `sideEffects` field is particularly error-prone for developers because by default it causes all files in your package to be considered dead code if no imports are used. If you add a new file containing side effects and forget to update that field, your package will likely break when people try to bundle it.

This is why esbuild includes a way to ignore side-effect annotations. You should only enable this if you encounter a problem where the bundle is broken because necessary code was unexpectedly removed from the bundle:

::: code-group

```bash [CLI]
esbuild app.js --bundle --ignore-annotations
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  ignoreAnnotations: true,
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:       []string{"app.js"},
    Bundle:            true,
    IgnoreAnnotations: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Enabling this means esbuild will no longer respect `/* @__PURE__ */` comments or the `sideEffects` field. It will still do automatic [tree shaking](./api/#tree-shaking) of unused imports, however, since that doesn't rely on annotations from developers. Ideally this flag is only a temporary workaround. You should report these issues to the maintainer of the package to get them fixed since they indicate a problem with the package and they will likely trip up other people too.

### Inject

> Supported by: [Build](./api/#build)

This option allows you to automatically replace a global variable with an import from another file. This can be a useful tool for adapting code that you don't control to a new environment. For example, assume you have a file called `process-cwd-shim.js` that exports a shim using the export name `process.cwd`:

```js
// process-cwd-shim.js
let processCwdShim = () => ''
export { processCwdShim as 'process.cwd' }
```

```js
// entry.js
console.log(process.cwd())
```

This is intended to replace uses of node's `process.cwd()` function to prevent packages that call it from crashing when run in the browser. You can use the inject feature to replace all references to the global property `process.cwd` with an import from that file:

::: code-group

```bash [CLI]
esbuild entry.js --inject:./process-cwd-shim.js --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['entry.js'],
  inject: ['./process-cwd-shim.js'],
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"entry.js"},
    Inject:      []string{"./process-cwd-shim.js"},
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

That results in something like this:

```js
// out.js
var processCwdShim = () => "";
console.log(processCwdShim());
```

You can think of the inject feature as similar to the [define](./api/#define) feature, except it replaces an expression with an import to a file instead of with a constant, and the expression to replace is specified using an export name in a file instead of using an inline string in esbuild's API.

#### Auto-import for JSX

React (the library for which JSX syntax was originally created) has a mode they call `automatic` where you don't have to `import` anything to use JSX syntax. Instead, the JSX-to-JS transformer will automatically import the correct JSX factory function for you. You can enable `automatic` JSX mode with esbuild's [`jsx`](./api/#jsx) setting. If you want auto-import for JSX and you are using a sufficiently new version of React, then you should be using the `automatic` JSX mode.

However, setting `jsx` to `automatic` unfortunately also means you are using a highly React-specific JSX transform instead of the default general-purpose JSX transform. This means writing a JSX factory function is more complicated, and it also means that the `automatic` mode doesn't work with libraries that expect to be used with the standard JSX transform (including older versions of React).

You can use esbuild's inject feature to automatically import the [factory](./api/#jsx-factory) and [fragment](./api/#jsx-fragment) for JSX expressions when the JSX transform is not set to `automatic`. Here's an example file that can be injected to do this:

```js
const { createElement, Fragment } = require('react')
export {
  createElement as 'React.createElement',
  Fragment as 'React.Fragment',
}
```

This code uses the React library as an example, but you can use this approach with any other JSX library as well with appropriate changes.

#### Injecting files without imports

You can also use this feature with files that have no exports. In that case the injected file just comes first before the rest of the output as if every input file contained `import "./file.js"`. Because of the way ECMAScript modules work, this injection is still "hygienic" in that symbols with the same name in different files are renamed so they don't collide with each other.

#### Conditionally injecting a file

If you want to conditionally import a file only if the export is actually used, you should mark the injected file as not having side effects by putting it in a package and adding `"sideEffects": false` in that package's `package.json` file. This setting is a [convention from Webpack](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free) that esbuild respects for any imported file, not just files used with inject.

### Keep names

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

In JavaScript the `name` property on functions and classes defaults to a nearby identifier in the source code. These syntax forms all set the `name` property of the function to `"fn"`:

```js
function fn() {}
let fn = function() {};
fn = function() {};
let [fn = function() {}] = [];
let {fn = function() {}} = {};
[fn = function() {}] = [];
({fn = function() {}} = {});
```

However, [minification](./api/#minify) renames symbols to reduce code size and [bundling](./api/#bundle) sometimes need to rename symbols to avoid collisions. That changes value of the `name` property for many of these cases. This is usually fine because the `name` property is normally only used for debugging. However, some frameworks rely on the `name` property for registration and binding purposes. If this is the case, you can enable this option to preserve the original `name` values even in minified code:

::: code-group

```bash [CLI]
esbuild app.js --minify --keep-names
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  minify: true,
  keepNames: true,
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:       []string{"app.js"},
    MinifyWhitespace:  true,
    MinifyIdentifiers: true,
    MinifySyntax:      true,
    KeepNames:         true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Mangle props

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

::: info
Using this feature can break your code in subtle ways. Do not use this feature unless you know what you are doing, and you know exactly how it will affect both your code and all of your dependencies.
:::

This setting lets you pass a regular expression to esbuild to tell esbuild to automatically rename all properties that match this regular expression. It's useful when you want to minify certain property names in your code either to make the generated code smaller or to somewhat obfuscate your code's intent.

Here's an example that uses the regular expression `_$` to mangle all properties ending in an underscore, such as `foo_`. This mangles `print({ foo_: 0 }.foo_)` into `print({ a: 0 }.a)`:

::: code-group

```bash [CLI]
esbuild app.js --mangle-props=_$
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  mangleProps: /_$/,
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    MangleProps: "_$",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Only mangling properties that end in an underscore is a reasonable heuristic because normal JS code doesn't typically contain identifiers like that. Browser APIs also don't use this naming convention so this also avoids conflicts with browser APIs. If you want to avoid mangling names such as [`__defineGetter__`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__defineGetter__) you could consider using a more complex regular expression such as `[^_]_$` (i.e. must end in a non-underscore followed by an underscore).

This is a separate setting instead of being part of the [minify](./api/#minify) setting because it's an unsafe transformation that does not work on arbitrary JavaScript code. It only works if the provided regular expression matches all of the properties that you want mangled and does not match any of the properties that you don't want mangled. It also only works if you do not under any circumstances reference a mangled property indirectly. For example, it means you can't use `obj[prop]` to reference a property where `prop` is a string containing the property name. Specifically the following syntax constructs are the only ones eligible for property mangling:


| **Syntax**  | **Example**    |
| ------------- |  ----: |
| Dot property accesses	| `x.foo_` | 
| Dot optional chains |	`x?.foo_` |
| Object properties |	`x = { foo_: y }` |
| Object methods | `x = { foo_() {} }` |
| Class fields |	`class x { foo_ = y }` |
| Class methods |	`class x { foo_() {} }` |
| Object destructuring bindings |	`let { foo_: x } = y` |
| Object destructuring assignments |	`({ foo_: x } = y)` |
| JSX element member expression |	`<X.foo_></X.foo_>` |
| JSX attribute names |	`<X foo_={y} />` |
| TypeScript namespace exports |	`namespace x { export let foo_ = y }` |
| TypeScript parameter properties |	`class x { constructor(public foo_) {} }` |

When using this feature, keep in mind that property names are only consistently mangled within a single esbuild API call but not across esbuild API calls. Each esbuild API call does an independent property mangling operation so output files generated by two different API calls may mangle the same property to two different names, which could cause the resulting code to behave incorrectly.

#### Quoted properties

By default, esbuild doesn't modify the contents of string literals. This means you can avoid property mangling for an individual property by quoting it as a string. However, you must consistently use quotes or no quotes for a given property everywhere for this to work. For example, `print({ foo_: 0 }.foo_)` will be mangled into `print({ a: 0 }.a)` while `print({ 'foo_': 0 }['foo_'])` will not be mangled.

If you would like for esbuild to also mangle the contents of string literals, you can explicitly enable that behavior like this:

::: code-group

```bash [CLI]
esbuild app.js --mangle-props=_$ --mangle-quoted
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  mangleProps: /_$/,
  mangleQuoted: true,
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:  []string{"app.js"},
    MangleProps:  "_$",
    MangleQuoted: api.MangleQuotedTrue,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

Enabling this makes the following syntax constructs also eligible for property mangling:

| **Syntax**  | **Example**    |
| ------------- |  ----: |
| Quoted property accesses	| `x['foo_']` | 
| Quoted optional chains	| `x?.['foo_']` | 
| Quoted object properties	| `x = { 'foo_': y }` | 
| Quoted object methods	| `x = { 'foo_'() {} }` | 
| Quoted class fields	| `class x { 'foo_' = y }` | 
| Quoted class methods	| `class x { 'foo_'() {} }` | 
| Quoted object destructuring bindings	| `let { 'foo_': x } = y` | 
| Quoted object destructuring assignments	| `({ 'foo_': x } = y)` | 
| String literals to the left of in	| `'foo_' in x` | 

#### Preventing renaming

If you would like to exclude certain properties from mangling, you can reserve them with an additional setting. For example, this uses the regular expression `^__.*__$` to reserve all properties that start and end with two underscores, such as `__foo__`:

::: code-group

```bash [CLI]
esbuild app.js --mangle-props=_$ "--reserve-props=^__.*__$"
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  mangleProps: /_$/,
  reserveProps: /^__.*__$/,
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:  []string{"app.js"},
    MangleProps:  "_$",
    ReserveProps: "^__.*__$",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

#### Persisting renaming decisions

Advanced usage of the property mangling feature involves storing the mapping from original name to mangled name in a persistent cache. When enabled, all mangled property renamings are recorded in the cache during the initial build. Subsequent builds reuse the renamings stored in the cache and add additional renamings for any newly-added properties. This has a few consequences:

- You can customize what mangled properties are renamed to by editing the cache before passing it to esbuild.

- The cache serves as a list of all properties that were mangled. You can easily scan it to see if there are any unexpected property renamings.

- You can disable mangling for individual properties by setting the renamed value to false instead of to a string. This is similar to the [reserve props](./api/#reserve-props) setting but on a per-property basis.

- You can ensure consistent renaming between builds (e.g. a main-thread file and a web worker, or a library and a plugin). Without this feature, each build would do an independent renaming operation and the mangled property names likely wouldn't be consistent.

For example, consider the following input file:

```js
console.log({
  someProp_: 1,
  customRenaming_: 2,
  disabledRenaming_: 3
});
```

If we want `customRenaming_` to be renamed to `cR_` and we don't want `disabledRenaming_` to be renamed at all, we can pass the following mangle cache JSON to esbuild:

```json
{
  "customRenaming_": "cR_",
  "disabledRenaming_": false
}
```

The mangle cache JSON can be passed to esbuild like this:

::: code-group

```bash [CLI]
esbuild app.js --mangle-props=_$ --mangle-cache=cache.json
```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.js'],
  mangleProps: /_$/,
  mangleCache: {
    customRenaming_: "cR_",
    disabledRenaming_: false
  },
})

console.log('updated mangle cache:', result.mangleCache)
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    MangleProps: "_$",
    MangleCache: map[string]interface{}{
      "customRenaming_":   "cR_",
      "disabledRenaming_": false,
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }

  fmt.Println("updated mangle cache:", result.MangleCache)
}
```

:::

When property naming is enabled, that will result in the following output file:

```js
console.log({
  a: 1,
  cR_: 2,
  disabledRenaming_: 3
});
```

And the following updated mangle cache:

```json
{
  "customRenaming_": "cR_",
  "disabledRenaming_": false,
  "someProp_": "a"
}
```

### Minify

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

When enabled, the generated code will be minified instead of pretty-printed. Minified code is generally equivalent to non-minified code but is smaller, which means it downloads faster but is harder to debug. Usually you minify code in production but not in development.

Enabling minification in esbuild looks like this:

::: code-group

```bash [CLI] $(1)
echo 'fn = obj => { return obj.x }' | esbuild --minify
fn=n=>n.x;
```

```js [JS] $(1,3,5)
import * as esbuild from 'esbuild'

var js = 'fn = obj => { return obj.x }'

(await esbuild.transform(js, {
  minify: true,
})).code
'fn=n=>n.x;\n'
```

```go [Go]

```

:::

This option does three separate things in combination: it removes whitespace, it rewrites your syntax to be more compact, and it renames local variables to be shorter. Usually you want to do all of these things, but these options can also be enabled individually if necessary:

::: code-group

```bash [CLI] $(1,4,9)
echo 'fn = obj => { return obj.x }' | esbuild --minify-whitespace
fn=obj=>{return obj.x};

echo 'fn = obj => { return obj.x }' | esbuild --minify-identifiers
fn = (n) => {
  return n.x;
};

echo 'fn = obj => { return obj.x }' | esbuild --minify-syntax
fn = (obj) => obj.x;
```

```js [JS] $(1,3,5,10,15>)
import * as esbuild from 'esbuild'

var js = 'fn = obj => { return obj.x }'
(await esbuild.transform(js, {
  minifyWhitespace: true,
})).code
'fn=obj=>{return obj.x};\n'

(await esbuild.transform(js, {
  minifyIdentifiers: true,
})).code
'fn = (n) => {\n  return n.x;\n};\n'

(await esbuild.transform(js, {
  minifySyntax: true,
})).code
'fn = (obj) => obj.x;\n'
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  css := "div { color: yellow }"

  result1 := api.Transform(css, api.TransformOptions{
    Loader:           api.LoaderCSS,
    MinifyWhitespace: true,
  })

  if len(result1.Errors) == 0 {
    fmt.Printf("%s", result1.Code)
  }

  result2 := api.Transform(css, api.TransformOptions{
    Loader:            api.LoaderCSS,
    MinifyIdentifiers: true,
  })

  if len(result2.Errors) == 0 {
    fmt.Printf("%s", result2.Code)
  }

  result3 := api.Transform(css, api.TransformOptions{
    Loader:       api.LoaderCSS,
    MinifySyntax: true,
  })

  if len(result3.Errors) == 0 {
    fmt.Printf("%s", result3.Code)
  }
}
```

:::

These same concepts also apply to CSS, not just to JavaScript:

::: code-group

```bash [CLI] $(1)
echo 'div { color: yellow }' | esbuild --loader=css --minify
div{color:#ff0}
```

```js [JS] $(1,3,5>)
import * as esbuild from 'esbuild'

var css = 'div { color: yellow }'

(await esbuild.transform(css, {
  loader: 'css',
  minify: true,
})).code
'div{color:#ff0}\n'
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  css := "div { color: yellow }"

  result := api.Transform(css, api.TransformOptions{
    Loader:            api.LoaderCSS,
    MinifyWhitespace:  true,
    MinifyIdentifiers: true,
    MinifySyntax:      true,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

The JavaScript minification algorithm in esbuild usually generates output that is very close to the minified output size of industry-standard JavaScript minification tools. [This benchmark](https://github.com/privatenumber/minification-benchmarks#readme) has an example comparison of output sizes between different minifiers. While esbuild is not the optimal JavaScript minifier in all cases (and doesn't try to be), it strives to generate minified output within a few percent of the size of dedicated minification tools for most code, and of course to do so much faster than other tools.

#### Considerations

Here are some things to keep in mind when using esbuild as a minifier:

- You should probably also set the [target](./api/#target) option when minification is enabled. By default esbuild takes advantage of modern JavaScript features to make your code smaller. For example, `a === undefined || a === null ? 1 : a` could be minified to `a ?? 1`. If you do not want esbuild to take advantage of modern JavaScript features when minifying, you should use an older language target such as `--target=es6`.

- The character escape sequence \n will be replaced with a newline character in JavaScript template literals. String literals will also be converted into template literals if the [target](./api/#target) supports them and if doing so would result in smaller output. **This is not a bug**. Minification means you are asking for smaller output, and the escape sequence \n takes two bytes while the newline character takes one byte.

- By default esbuild won't minify the names of top-level declarations. This is because esbuild doesn't know what you will be doing with the output. You might be injecting the minified code into the middle of some other code, in which case minifying top-level declaration names would be unsafe. Setting an output [format](./api/#format) (or enabling [bundling](./api/#bundle), which picks an output format for you if you haven't set one) tells esbuild that the output will be run within its own scope, which means it's then safe to minify top-level declaration names.

- Minification is not safe for 100% of all JavaScript code. This is true for esbuild as well as for other popular JavaScript minifiers such as [terser](https://github.com/terser/terser). In particular, esbuild is not designed to preserve the value of calling `.toString()` on a function. The reason for this is because if all code inside all functions had to be preserved verbatim, minification would hardly do anything at all and would be virtually useless. However, this means that JavaScript code relying on the return value of `.toString()` will likely break when minified. For example, some patterns in the AngularJS framework break when code is minified because AngularJS uses `.toString()` to read the argument names of functions. A workaround is to use [explicit annotations instead](https://docs.angularjs.org/api/auto/service/$injector#injection-function-annotation).

- By default esbuild does not preserve the value of `.name` on function and class objects. This is because most code doesn't rely on this property and using shorter names is an important size optimization. However, some code does rely on the `.name` property for registration and binding purposes. If you need to rely on this you should enable the [keep names](./api/#keep-names) option.

- Use of certain JavaScript features can disable many of esbuild's optimizations including minification. Specifically, using direct `eval` and/or the `with` statement prevent esbuild from renaming identifiers to smaller names since these features cause identifier binding to happen at run time instead of compile time. This is almost always unintentional, and only happens because people are unaware of what direct `eval` is and why it's bad.

If you are thinking about writing some code like this:

```js
// Direct eval (will disable minification for the whole file)
let result = eval(something)
```

You should probably write your code like this instead so your code can be minified:

```js
// Indirect eval (has no effect on the surrounding code)
let result = (0, eval)(something)
```

There is more information about the consequences of direct `eval` and the available alternatives [here](./content-types/#direct-eval).

- The minification algorithm in esbuild does not yet do advanced code optimizations. In particular, the following code optimizations are possible for JavaScript code but are not done by esbuild (not an exhaustive list):

  - Dead-code elimination within function bodies
  - Function inlining
  - Cross-statement constant propagation
  - Object shape modeling
  - Allocation sinking
  - Method devirtualization
  - Symbolic execution
  - JSX expression hoisting
  - TypeScript enum detection and inlining

If your code makes use of patterns that require some of these forms of code optimization to be compact, or if you are searching for the optimal JavaScript minification algorithm for your use case, you should consider using other tools. Some examples of tools that implement some of these advanced code optimizations include [Terser](https://github.com/terser/terser#readme) and [Google Closure Compiler](https://github.com/google/closure-compiler#readme).

### Pure

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

There is a convention used by various JavaScript tools where a special comment containing either `/* @__PURE__ */` or `/* #__PURE__ */` before a new or call expression means that that expression can be removed if the resulting value is unused. It looks like this:

```js
let button = /* @__PURE__ */ React.createElement(Button, null);
```

This information is used by bundlers such as esbuild during tree shaking (a.k.a. dead code removal) to perform fine-grained removal of unused imports across module boundaries in situations where the bundler is not able to prove by itself that the removal is safe due to the dynamic nature of JavaScript code.

Note that while the comment says "pure", it confusingly does not indicate that the function being called is pure. For example, it does not indicate that it is ok to cache repeated calls to that function. The name is essentially just an abstract shorthand for "ok to be removed if unused".

Some expressions such as JSX and certain built-in globals are automatically annotated as `/* @__PURE__ */` in esbuild. You can also configure additional globals to be marked `/* @__PURE__ */` as well. For example, you can mark the global `document.createElement` function as such to have it be automatically removed from your bundle when the bundle is minified as long as the result isn't used.

It's worth mentioning that the effect of the annotation only extends to the call itself, not to the arguments. Arguments with side effects are still kept even when minification is enabled:

::: code-group

```bash [CLI] $(1,3)
echo 'document.createElement(elemName())' | esbuild --pure:document.createElement
/* @__PURE__ */ document.createElement(elemName());

echo 'document.createElement(elemName())' | esbuild --pure:document.createElement --minify
elemName();
```

```js [JS] $(1,3,5,10>)
import * as esbuild from 'esbuild'

let js = 'document.createElement(elemName())'

(await esbuild.transform(js, {
  pure: ['document.createElement'],
})).code
'/* @__PURE__ */ document.createElement(elemName());\n'

(await esbuild.transform(js, {
  pure: ['document.createElement'],
  minify: true,
})).code
'elemName();\n'
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "document.createElement(elemName())"

  result1 := api.Transform(js, api.TransformOptions{
    Pure: []string{"document.createElement"},
  })

  if len(result1.Errors) == 0 {
    fmt.Printf("%s", result1.Code)
  }

  result2 := api.Transform(js, api.TransformOptions{
    Pure:         []string{"document.createElement"},
    MinifySyntax: true,
  })

  if len(result2.Errors) == 0 {
    fmt.Printf("%s", result2.Code)
  }
}
```

:::

Note that if you are trying to remove all calls to `console` API methods such as `console.log` and also want to remove the evaluation of arguments with side effects, there is a special case available for this: you can use the [drop feature](./api/#drop) instead of marking `console` API calls as pure. However, this mechanism is specific to the `console` API and doesn't work with other call expressions.

### Tree shaking

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

Tree shaking is the term the JavaScript community uses for dead code elimination, a common compiler optimization that automatically removes unreachable code. Within esbuild, this term specifically refers to declaration-level dead code removal.

Tree shaking is easiest to explain with an example. Consider the following file. There is one used function and one unused function:

```js
// input.js
function one() {
  console.log('one')
}
function two() {
  console.log('two')
}
one()
```
If you bundle this file with `esbuild --bundle input.js --outfile=output.js`, the unused function will automatically be discarded leaving you with the following output:

```js
// input.js
function one() {
  console.log("one");
}
one();
```

This even works if we split our functions off into a separate library file and import them using an `import` statement:

```js
// lib.js
export function one() {
  console.log('one')
}
export function two() {
  console.log('two')
}
```

```js
// input.js
import * as lib from './lib.js'
lib.one()
```

If you bundle this file with `esbuild --bundle input.js --outfile=output.js`, the unused function and unused import will still be automatically discarded leaving you with the following output:

```js
// lib.js
function one() {
  console.log("one");
}

// input.js
one();
```

This way esbuild will only bundle the parts of your packages that you actually use, which can sometimes be a substantial size savings. Note that esbuild's tree shaking implementation relies on the use of ECMAScript module `import` and `export` statements. It does not work with CommonJS modules. Many packages on npm include both formats and esbuild tries to pick the format that works with tree shaking by default. You can customize which format esbuild picks using the [main fields](./api/#main-fields) and/or [conditions](./api/#conditions) options depending on the package.

By default, tree shaking is only enabled either when [bundling](h./api/#bundle) is enabled or when the output [format](./api/#format) is set to `iife`, otherwise tree shaking is disabled. You can force-enable tree shaking by setting it to `true`:

::: code-group

```bash [CLI]
esbuild app.js --tree-shaking=true
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  treeShaking: true,
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
    TreeShaking: api.TreeShakingTrue,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

You can also force-disable tree shaking by setting it to `false`:

::: code-group

```bash [CLI]
esbuild app.js --tree-shaking=false
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  treeShaking: false,
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
    TreeShaking: api.TreeShakingFalse,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

#### Tree shaking and side effects

The side effect detection used for tree shaking is conservative, meaning that esbuild only considers code removable as dead code if it can be sure that there are no hidden side effects. For example, primitive literals such as `12.34` and `"abcd"` are side-effect free and can be removed while expressions such as `"ab" + cd` and `foo.bar` are not side-effect free (joining strings invokes `toString()` which can have side effects, and member access can invoke a getter which can also have side effects). Even referencing a global identifier is considered to be a side effect because it will throw a `ReferenceError` if there is no global with that name. Here's an example:

```js
// These are considered side-effect free
let a = 12.34;
let b = "abcd";
let c = { a: a };

// These are not considered side-effect free
// since they could cause some code to run
let x = "ab" + cd;
let y = foo.bar;
let z = { [x]: x };
```

Sometimes it's desirable to allow some code to be tree shaken even if that code can't be automatically determined to have no side effects. This can be done with a [pure annotation comment](./api/#pure) which tells esbuild to trust the author of the code that there are no side effects within the annotated code. The annotation comment is `/* @__PURE__ */` and can only precede a new or call expression. You can annotate an immediately-invoked function expression and put arbitrary side effects inside the function body:

```js
// This is considered side-effect free due to
// the annotation, and will be removed if unused
let gammaTable = /* @__PURE__ */ (() => {
  // Side-effect detection is skipped in here
  let table = new Uint8Array(256);
  for (let i = 0; i < 256; i++)
    table[i] = Math.pow(i / 255, 2.2) * 255;
  return table;
})();
```

While the fact that `/* @__PURE__ */` only works on call expressions can sometimes make code more verbose, a big benefit of this syntax is that it's portable across many other tools in the JavaScript ecosystem including the popular [UglifyJS](https://github.com/mishoo/uglifyjs) and [Terser](https://github.com/terser/terser) JavaScript minifiers (which are used by other major tools including [Webpack](https://github.com/webpack/webpack) and [Parcel](https://github.com/parcel-bundler/parcel)).

Note that the annotations cause esbuild to assume that the annotated code is side-effect free. If the annotations are wrong and the code actually does have important side effects, these annotations can result in broken code. If you are bundling third-party code with annotations that have been authored incorrectly, you may need to enable [ignoring annotations](./api/#ignore-annotations) to make sure the bundled code is correct.

## Source maps

### Source root

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This feature is only relevant when [source maps](./api/#sourcemap) are enabled. It lets you set the value of the `sourceRoot` field in the source map, which specifies the path that all other paths in the source map are relative to. If this field is not present, all paths in the source map are interpreted as being relative to the directory containing the source map instead.

You can configure `sourceRoot` like this:

::: code-group

```bash [CLI]
esbuild app.js --sourcemap --source-root=https://raw.githubusercontent.com/some/repo/v1.2.3/
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  sourcemap: true,
  sourceRoot: 'https://raw.githubusercontent.com/some/repo/v1.2.3/',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Sourcemap:   api.SourceMapInline,
    SourceRoot:  "https://raw.githubusercontent.com/some/repo/v1.2.3/",
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Sourcefile

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This option sets the file name when using an input which has no file name. This happens when using the transform API and when using the build API with stdin. The configured file name is reflected in error messages and in source maps. If it's not configured, the file name defaults to `<stdin>`. It can be configured like this:

::: code-group

```bash [CLI]
cat app.js | esbuild --sourcefile=example.js --sourcemap
```

```js [JS]
import * as esbuild from 'esbuild'
import fs from 'node:fs'

let js = fs.readFileSync('app.js', 'utf8')
let result = await esbuild.transform(js, {
  sourcefile: 'example.js',
  sourcemap: 'inline',
})

console.log(result.code)
```

```go [Go]
package main

import "fmt"
import "io/ioutil"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js, err := ioutil.ReadFile("app.js")
  if err != nil {
    panic(err)
  }

  result := api.Transform(string(js),
    api.TransformOptions{
      Sourcefile: "example.js",
      Sourcemap:  api.SourceMapInline,
    })

  if len(result.Errors) == 0 {
    fmt.Printf("%s %s", result.Code)
  }
}
```

:::

### Sourcemap

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

Source maps can make it easier to debug your code. They encode the information necessary to translate from a line/column offset in a generated output file back to a line/column offset in the corresponding original input file. This is useful if your generated code is sufficiently different from your original code (e.g. your original code is TypeScript or you enabled [minification](./api/#minify)). This is also useful if you prefer looking at individual files in your browser's developer tools instead of one big bundled file.

Note that source map output is supported for both JavaScript and CSS, and the same options apply to both. Everything below that talks about `.js` files also applies similarly to `.cs`s files.

There are four different modes for source map generation:

1. `linked`

  This mode means the source map is generated into a separate `.js.map` output file alongside the .js output file, and the .js output file contains a special `//# sourceMappingURL=` comment that points to the `.js.map` output file. That way the browser knows where to find the source map for a given file when you open the debugger. Use `linked` source map mode like this:

::: code-group

```bash [CLI]
esbuild app.ts --sourcemap --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.ts'],
  sourcemap: true,
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
    Sourcemap:   api.SourceMapLinked,
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

2. `external`

  This mode means the source map is generated into a separate `.js.map` output file alongside the `.js` output file, but unlike linked mode the `.js` output file does not contain a `//# sourceMappingURL=` comment. Use `external` source map mode like this:

::: code-group

```bash [CLI]
esbuild app.ts --sourcemap=external --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.ts'],
  sourcemap: 'external',
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
    Sourcemap:   api.SourceMapExternal,
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

3. `inline`

This mode means the source map is appended to the end of the `.js` output file as a base64 payload inside a `//# sourceMappingURL=` comment. No additional `.js.map` output file is generated. Keep in mind that source maps are usually very big because they contain all of your original source code, so you usually do not want to ship code containing `inline` source maps. To remove the source code from the source map (keeping only the file names and the line/column mappings), use the [sources content](./api/#sources-content) option. Use `inline` source map mode like this:

::: code-group

```bash [CLI]
esbuild app.ts --sourcemap=inline --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.ts'],
  sourcemap: 'inline',
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
    Sourcemap:   api.SourceMapInline,
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

4. `both`

  This mode is a combination of `inline` and `external`. The source map is appended inline to the end of the `.js` output file, and another copy of the same source map is written to a separate `.js.map` output file alongside the `.js` output file. Use both source map mode like this:

::: code-group

```bash [CLI]
esbuild app.ts --sourcemap=both --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.ts'],
  sourcemap: 'both',
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
    Sourcemap:   api.SourceMapInlineAndExternal,
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

The [build](./api/#build) API supports all four source map modes listed above, but the [transform](./api/#transform) API does not support the `linked` mode. This is because the output returned from the transform API does not have an associated filename. If you want the output of the transform API to have a source map comment, you can append one yourself. In addition, the CLI form of the transform API only supports the `inline` mode because the output is written to stdout so generating multiple output files is not possible.

If you want to "peek under the hood" to see what a source map does (or to debug problems with your source map), you can upload the relevant output file and the associated source map here: [Source Map Visualization](https://evanw.github.io/source-map-visualization/).

### Using source maps

In the browser, source maps should be automatically picked up by the browser's developer tools as long as the source map setting is enabled. Note that the browser only uses the source maps to alter the display of stack traces when they are logged to the console. The stack traces themselves are not modified so inspecting `error.stack` in your code will still give the unmapped stack trace containing compiled code. Here's how to enable this setting in your browser's developer tools:

- Chrome: ⚙ → Enable JavaScript source maps
- Safari: ⚙ → Sources → Enable source maps
- Firefox: ··· → Enable Source Maps

In node, source maps are supported natively starting with [version v12.12.0](https://nodejs.org/en/blog/release/v12.12.0/). This feature is disabled by default but can be enabled with a flag. Unlike in the browser, the actual stack traces are also modified in node so inspecting `error.stack` in your code will give the mapped stack trace containing your original source code. Here's how to enable this setting in node (the `--enable-source-maps` flag must come before the script file name):

```bash
node --enable-source-maps app.js
```

## Sources content

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

[Source maps](./api/#sourcemap) are generated using [version 3](https://sourcemaps.info/spec.html) of the source map format, which is by far the most widely-supported variant. Each source map will look something like this:

```json
{
  "version": 3,
  "sources": ["bar.js", "foo.js"],
  "sourcesContent": ["bar()", "foo()\nimport './bar'"],
  "mappings": ";AAAA;;;ACAA;",
  "names": []
}
```

The `sourcesContent` field is an optional field that contains all of the original source code. This is helpful for debugging because it means the original source code will be available in the debugger.

However, it's not needed in some scenarios. For example, if you are just using source maps in production to generate stack traces that contain the original file name, you don't need the original source code because there is no debugger involved. In that case it can be desirable to omit the `sourcesContent` field to make the source map smaller:

::: code-group

```bash [CLI]
esbuild --bundle app.js --sourcemap --sources-content=false
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  bundle: true,
  entryPoints: ['app.js'],
  sourcemap: true,
  sourcesContent: false,
  outfile: 'out.js',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    Bundle:         true,
    EntryPoints:    []string{"app.js"},
    Sourcemap:      api.SourceMapInline,
    SourcesContent: api.SourcesContentExclude,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

## Build metadata

### Analyze

> Supported by: [Build](./api/#build)

::: info
If you're looking for an interactive visualization, try esbuild's [Bundle Size Analyzer](./analyze/) instead. You can upload your esbuild [metafile](./api/#metafile) to see a bundle size breakdown.
:::

Using the analyze feature generates an easy-to-read report about the contents of your bundle:

::: code-group

```bash [CLI] $(1)
esbuild --bundle example.jsx --outfile=out.js --minify --analyze

  out.js                                                                    27.6kb  100.0%
   ├ node_modules/react-dom/cjs/react-dom-server.browser.production.min.js  19.2kb   69.8%
   ├ node_modules/react/cjs/react.production.min.js                          5.9kb   21.4%
   ├ node_modules/object-assign/index.js                                     962b     3.4%
   ├ example.jsx                                                             137b     0.5%
   ├ node_modules/react-dom/server.browser.js                                 50b     0.2%
   └ node_modules/react/index.js                                              50b     0.2%

...
```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['example.jsx'],
  outfile: 'out.js',
  minify: true,
  metafile: true,
})

console.log(await esbuild.analyzeMetafile(result.metafile))
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "fmt"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:       []string{"example.jsx"},
    Outfile:           "out.js",
    MinifyWhitespace:  true,
    MinifyIdentifiers: true,
    MinifySyntax:      true,
    Metafile:          true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }

  fmt.Printf("%s", api.AnalyzeMetafile(result.Metafile, api.AnalyzeMetafileOptions{}))
}
```

:::

The information shows which input files ended up in each output file as well as the percentage of the output file they ended up taking up. If you would like additional information, you can enable the "verbose" mode. This currently shows the import path from the entry point to each input file which tells you why a given input file is being included in the bundle:

::: code-group

```bash [CLI] $(1)
esbuild --bundle example.jsx --outfile=out.js --minify --analyze=verbose

  out.js ─────────────────────────────────────────────────────────────────── 27.6kb ─ 100.0%
   ├ node_modules/react-dom/cjs/react-dom-server.browser.production.min.js ─ 19.2kb ── 69.8%
   │  └ node_modules/react-dom/server.browser.js
   │     └ example.jsx
   ├ node_modules/react/cjs/react.production.min.js ───────────────────────── 5.9kb ── 21.4%
   │  └ node_modules/react/index.js
   │     └ example.jsx
   ├ node_modules/object-assign/index.js ──────────────────────────────────── 962b ──── 3.4%
   │  └ node_modules/react-dom/cjs/react-dom-server.browser.production.min.js
   │     └ node_modules/react-dom/server.browser.js
   │        └ example.jsx
   ├ example.jsx ──────────────────────────────────────────────────────────── 137b ──── 0.5%
   ├ node_modules/react-dom/server.browser.js ──────────────────────────────── 50b ──── 0.2%
   │  └ example.jsx
   └ node_modules/react/index.js ───────────────────────────────────────────── 50b ──── 0.2%
      └ example.jsx

...
```

```js [JS]
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['example.jsx'],
  outfile: 'out.js',
  minify: true,
  metafile: true,
})

console.log(await esbuild.analyzeMetafile(result.metafile, {
  verbose: true,
}))
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "fmt"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:       []string{"example.jsx"},
    Outfile:           "out.js",
    MinifyWhitespace:  true,
    MinifyIdentifiers: true,
    MinifySyntax:      true,
    Metafile:          true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }

  fmt.Printf("%s", api.AnalyzeMetafile(result.Metafile, api.AnalyzeMetafileOptions{
    Verbose: true,
  }))
}
```

:::

This analysis is just a visualization of the information that can be found in the metafile. If this analysis doesn't exactly suit your needs, you are welcome to build your own visualization using the information in the metafile.

Note that this formatted analysis summary is intended for humans, not machines. The specific formatting may change over time which will likely break any tools that try to parse it. You should not write a tool to parse this data. You should be using the information in the [JSON metadata file](./api/#metafile) instead. Everything in this visualization is derived from the JSON metadata so you are not losing out on any information by not parsing esbuild's formatted analysis summary.

### Metafile

> Supported by: [Build](./api/#build)

This option tells esbuild to produce some metadata about the build in JSON format. The following example puts the metadata in a file called `meta.json`:

::: code-group

```bash [CLI]
esbuild app.js --bundle --metafile=meta.json --outfile=out.js
```

```js [JS]
import * as esbuild from 'esbuild'
import fs from 'node:fs'

let result = await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  metafile: true,
  outfile: 'out.js',
})

fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
```

```go [Go]
package main

import "io/ioutil"
import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Bundle:      true,
    Metafile:    true,
    Outfile:     "out.js",
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }

  ioutil.WriteFile("meta.json", []byte(result.Metafile), 0644)
}
```

:::

This data can then be analyzed by other tools. For an interactive visualization, you can use esbuild's own [Bundle Size Analyzer](./analyze/). For a quick textual analysis, you can use esbuild's build-in [analyze](./api/#analyze) feature. Or you can write your own analysis which uses this information.

The metadata JSON format looks like this (described using a TypeScript interface):

```ts
interface Metafile {
  inputs: {
    [path: string]: {
      bytes: number
      imports: {
        path: string
        kind: string
        external?: boolean
        original?: string
      }[]
      format?: string
    }
  }
  outputs: {
    [path: string]: {
      bytes: number
      inputs: {
        [path: string]: {
          bytesInOutput: number
        }
      }
      imports: {
        path: string
        kind: string
        external?: boolean
      }[]
      exports: string[]
      entryPoint?: string
      cssBundle?: string
    }
  }
}
```

## Logging

### Color

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This option enables or disables colors in the error and warning messages that esbuild writes to stderr file descriptor in the terminal. By default, color is automatically enabled if stderr is a TTY session and automatically disabled otherwise. Colored output in esbuild looks like this:

<pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">The "typeof" operator will never evaluate to "null"</span><span> [impossible-typeof]

    example.js:2:16:
</span><span class="color-dim">      2 │ log(typeof x == </span><span class="color-green">"null"</span><span class="color-dim">)
        ╵                 </span><span class="color-green">~~~~~~</span><span>

  The expression "typeof x" actually evaluates to "object" in JavaScript, not "null". You need to
  use "x === null" to test for null.

</span><span class="color-red">✘ </span><span class="bg-red color-red">[</span><span class="bg-red color-white">ERROR</span><span class="bg-red color-red">]</span><span> </span><span class="color-bold">Could not resolve "logger"</span><span>

    example.js:1:16:
</span><span class="color-dim">      1 │ import log from </span><span class="color-green">"logger"</span><span class="color-dim">
        ╵                 </span><span class="color-green">~~~~~~~~</span><span>

  You can mark the path "logger" as external to exclude it from the bundle, which will remove this
  error.</span></pre>

Colored output can be force-enabled by setting color to `true`. This is useful if you are piping esbuild's stderr output into a TTY yourself:

::: code-group

```bash [CLI]
echo 'typeof x == "null"' | esbuild --color=true 2> stderr.txt
```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'typeof x == "null"'
await esbuild.transform(js, {
  color: true,
})
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "typeof x == 'null'"

  result := api.Transform(js, api.TransformOptions{
    Color: api.ColorAlways,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

Colored output can also be set to `false` to disable colors.

### Format messages

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This API call can be used to format the log errors and warnings returned by the [build](./api/#build) API and [transform](./api/#transform) APIs as a string using the same formatting that esbuild itself uses. This is useful if you want to customize the way esbuild's logging works, such as processing the log messages before they are printed or printing them to somewhere other than to the console. Here's an example:

::: code-group

```js [JS]
import * as esbuild from 'esbuild'

let formatted = await esbuild.formatMessages([
  {
    text: 'This is an error',
    location: {
      file: 'app.js',
      line: 10,
      column: 4,
      length: 3,
      lineText: 'let foo = bar',
    },
  },
], {
  kind: 'error',
  color: false,
  terminalWidth: 100,
})

console.log(formatted.join('\n'))
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"
import "strings"

func main() {
  formatted := api.FormatMessages([]api.Message{
    {
      Text: "This is an error",
      Location: &api.Location{
        File:     "app.js",
        Line:     10,
        Column:   4,
        Length:   3,
        LineText: "let foo = bar",
      },
    },
  }, api.FormatMessagesOptions{
    Kind:          api.ErrorMessage,
    Color:         false,
    TerminalWidth: 100,
  })

  fmt.Printf("%s", strings.Join(formatted, "\n"))
}
```

:::

#### Options

The following options can be provided to control the formatting:

::: code-group

```js [JS]
interface FormatMessagesOptions {
  kind: 'error' | 'warning';
  color?: boolean;
  terminalWidth?: number;
}
```

```go [Go]
type FormatMessagesOptions struct {
  Kind          MessageKind
  Color         bool
  TerminalWidth int
}
```

:::

- `kind`

  Controls whether these log messages are printed as errors or warnings.

- `color`

  If this is true, Unix-style terminal escape codes are included for colored output.

- `terminalWidth`

  Provide a positive value to wrap long lines so that they don't overflow past the provided column width. Provide 0 to disable word wrapping.

### Log level

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

The log level can be changed to prevent esbuild from printing warning and/or error messages to the terminal. The six log levels are:

- `silent`

  Do not show any log output. This is the default log level when using the JS [transform](./api/#transform) API.

- `error`

  Only show errors.

- `warning`

  Only show warnings and errors. This is the default log level when using the JS [build](./api/#build) API.

- `info`

  Show warnings, errors, and an output file summary. This is the default log level when using the CLI.

- `debug`

  Log everything from info and some additional messages that may help you debug a broken bundle. This log level has a performance impact and some of the messages may be false positives, so this information is not shown by default.

- `verbose`

  This generates a torrent of log messages and was added to debug issues with file system drivers. It's not intended for general use.

The log level can be set like this:

::: code-group

```bash [CLI]
echo 'typeof x == "null"' | esbuild --log-level=error
```

```js [JS]
import * as esbuild from 'esbuild'

let js = 'typeof x == "null"'
await esbuild.transform(js, {
  logLevel: 'error',
})
```

```go [Go]
package main

import "fmt"
import "github.com/evanw/esbuild/pkg/api"

func main() {
  js := "typeof x == 'null'"

  result := api.Transform(js, api.TransformOptions{
    LogLevel: api.LogLevelError,
  })

  if len(result.Errors) == 0 {
    fmt.Printf("%s", result.Code)
  }
}
```

:::

### Log limit

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

By default, esbuild stops reporting log messages after 10 messages have been reported. This avoids the accidental generation of an overwhelming number of log messages, which can easily lock up slower terminal emulators such as Windows command prompt. It also avoids accidentally using up the whole scroll buffer for terminal emulators with limited scroll buffers.

The log limit can be changed to another value, and can also be disabled completely by setting it to zero. This will show all log messages:

::: code-group

```bash [CLI]
esbuild app.js --log-limit=0
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  logLimit: 0,
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
    LogLimit:    0,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

### Log override

> Supported by: [Build](./api/#build) and [Transform](./api/#transform)

This feature lets you change the log level of individual types of log messages. You can use it to silence a particular type of warning, to enable additional warnings that aren't enabled by default, or even to turn warnings into errors.

For example, when targeting older browsers, esbuild automatically transforms regular expression literals which use features that are too new for those browsers into `new RegExp()` calls to allow the generated code to run without being considered a syntax error by the browser. However, these calls will still throw at runtime if you don't add a polyfill for `RegExp` because that regular expression syntax is still unsupported. If you want esbuild to generate a warning when you use newer unsupported regular expression syntax, you can do that like this:

::: code-group

```bash [CLI]
esbuild app.js --log-override:unsupported-regexp=warning --target=chrome50
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  logOverride: {
    'unsupported-regexp': 'warning',
  },
  target: 'chrome50',
})
```

```go [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    LogOverride: map[string]api.LogLevel{
      "unsupported-regexp": api.LogLevelWarning,
    },
    Engines: []api.Engine{
      {Name: api.EngineChrome, Version: "50"},
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

The log level for each message type can be overridden to any value supported by the [log level](./api/#log-level) setting. All currently-available message types are listed below (click on each one for an example log message):

<LogOverride />

These message types should be reasonably stable but new ones may be added and old ones may occasionally be removed in the future. If a message type is removed, any overrides for that message type will just be silently ignored.

<script setup>
import LogOverride from '../../components/LogOverride.vue'
</script>

<style scoped>
.color-yellow {
  color: #F2D42D;
}
.bg-yellow {
  background: #F2D42D;
}
.color-black {
  color: #000;
}
.color-green {
  color: #58A549;
}
.color-dim {
  color: #777;
}
.bg-red {
  background: #e24834;
}
.color-red {
  color: #e24834;
}
pre {
  background: rgba(127,127,127,.1);
  position: relative;
  font: 14px/140% Noto Sans Mono,monospace;
  border: 1px solid rgba(127,127,127,.5);
  border-radius: 10px;
  padding: 8px 10px;
  margin: 30px 0;
  overflow-x: auto;
}
</style>
