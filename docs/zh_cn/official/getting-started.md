# 快速开始

## 安装 esbuild

首先，本地下载安装esbuild命令。使用[npm](https://docs.npmjs.com/cli/v8/commands/npm-install)（安装了JavaScript运行时的[node](https://nodejs.org/) JavaScript runtime)后，会自动安装）可以安装一个预编译好的本地可执行程序：

```:no-line-numbers
npm install --save-exact esbuild
```

这会安装esbuild到你当前目录下的`node_modules`目录里。可以运行esbuild命令来测试一下是否安装运行正确：

::: code-group

```bash:no-line-numbers [Unix]
./node_modules/.bin/esbuild --version
```

```cmd:no-line-numbers [Windows]
.\node_modules\.bin\esbuild --version
```

:::

推荐的安装esbuild的方式是使用npm安装本地可执行程序。但如果你不想如此，可以尝试[其他安装方式](#other-ways-to-install)。

## 首个打包

这是一个关于esbuild有什么功能和怎么用的快速上手例子。首先，安装`react`和`react-dom`包：

```:no-line-numbers
npm install react react-dom
```

然后新建一个名为`app.jsx`的文件，内容如下：

```js
import * as React from 'react'
import * as Server from 'react-dom/server'

let Greet = () => <h1>Hello, world!</h1>
console.log(Server.renderToString(<Greet />))
```

最后，告诉esbuild来打包文件：

::: code-group

```bash:no-line-numbers [Unix]
./node_modules/.bin/esbuild app.jsx --bundle --outfile=out.js
```

```cmd:no-line-numbers [Windows]
.\node_modules\.bin\esbuild app.jsx --bundle --outfile=out.js
```

:::

这将会生成一个名叫`out.js`包含你的代码和React库捆绑一起的文件。文件内容完全包含所有，不再依赖于`node_modules`目录。如果使用`node out.js`运行，可得类似如下内容：

```html:no-line-numbers
<h1 data-reactroot="">Hello, world!</h1>
```

注意到esbuild也可以转化JSX语法到JavaScreipt，仅用`.jsx`扩展，不需任何其他配置。虽然esbuild可以进行配置，但它会尝试使用合理的默认值，以便在许多常见情况下自动工作。如果想在`.js`文件中使用JSX语法，可以使用`--loader:.js=jsx`标志告诉esbuild。在[API文档]((./api))中查看更多可用配置选项的内容。

## 构建脚本

构建命令有时需要重复运行，因此可以将其自动化。一个自然的方式是在`package.json`文件中添加如下所示的构建脚本：

```json
{
  "scripts": {
    "build": "esbuild app.jsx --bundle --outfile=out.js"
  }
}
```

注意这里`esbuild`命令没有相对路径。能运行是因为所有在`scripts`中定义的如上面的`esbuild`命令已经在路径上了（只要已经[安装了该包](#install-esbuild)）。

构建脚本可以被如下方式方式调用：

```:no-line-numbers
npm run build
```

然而，如果需要传递很多可选项给esbuild，使用命令行交互方式会变得很不便。对于更复杂的使用，需要用esbuild的JavaScript API接口写一个JavaScript构建脚本。大概方式如下（注意，这个代码需要以`.mjs`为文件名后缀，因为用的是`import`关键字）：

```js
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  outfile: 'out.js',
})
```

esbuild的`build`函数运行于一个子进程中，当构建完成时，返回一个结果。也有一个同步的名为`buildSync`的API接口。对于构建脚本，异步API更好，因为[插件](./plugins)仅工作于异步API。你可以在[API文档](./api)中查看更多关于配置选项的内容。

## 打包成浏览器版

打包器默认打包成浏览器可用的代码，所以不需要额外的配置。开发构建可以用`--sourcemap`启用[源码映射](./api#source-map)，生产环境构建可以用`--minify`启用[缩小包大小](./api#minify)。配置浏览器[目标](./api#target)环境，可以将JavaScript语法中的新语法转化成老语法。所有这些综合起来如下：

::: code-group
```:no-line-numbers [CLI]
esbuild app.jsx --bundle --minify --sourcemap --target=chrome58,firefox57,safari11,edge16
```

```js {8} [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
  outfile: 'out.js',
})
```

```go {13-18} [Go]
package main

import "github.com/evanw/esbuild/pkg/api"
import "os"

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints:       []string{"app.jsx"},
    Bundle:            true,
    MinifyWhitespace:  true,
    MinifyIdentifiers: true,
    MinifySyntax:      true,
    Engines: []api.Engine{
      {api.EngineChrome, "58"},
      {api.EngineFirefox, "57"},
      {api.EngineSafari, "11"},
      {api.EngineEdge, "16"},
    },
    Write: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```
:::

有些npm包不支持运行在浏览器上。有时，您可以使用esbuild的配置选项来解决某些问题，并依然成功地打包。未定义的全局常量依然可以用简单的[define](./api#define)功能或是复杂场景中用[inject](./api#inject)功能。

## 打包成node版

尽管当用node时，打包器可能不是必须的，但在node中运行前用esbuild处理一下代码还是有好处的。打包会自动去掉TypeScript类型，转化ECMAScript模块语法成CommonJS，转译新的JavaScript语法成特定版本node的老语法。发布包前打包项目是有益处的，可以使包更小，从而加载时从文件系统读取花费更少的时间。

如果要打包代码成能运行在node端，需要通过传递`--platform=node`给esbuild来配置[平台](./api#platform)。这同时将一些不同的设置更改为node友好的默认值。例如，所有node内建的包，如fs，会自动标记为外部的，从而esbuild不会打包他们。这个配置会使`package.json`中的browser字段失效。

如果代码中使用了新的JavaScript语法，从而使得某个node版本不能工作，可以配置[目标](./api#target)node版本：

::: code-group
```:no-line-numbers [CLI]
esbuild app.js --bundle --platform=node --target=node10.4
```

```js [JS]
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  platform: 'node',
  target: ['node10.4'],
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
    Engines: []api.Engine{
      {api.EngineNode, "10.4"},
    },
    Write: true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```
:::

有些依赖包不需要打包。有很多特定node的功能，诸如`__dirname`、`import.meta.url`、`fs.readFileSync`和`*.node`原生二进制包，esbuild打包时不支持。可以排除所有的依赖包，通过配置[packages](./api#packages)外部化：

::: code-group
```:no-line-numbers [CLI]
esbuild app.jsx --bundle --platform=node --packages=external
```

```js [JS]
require('esbuild').buildSync({
  entryPoints: ['app.jsx'],
  bundle: true,
  platform: 'node',
  packages: 'external',
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
    Bundle:      true,
    Platform:    api.PlatformNode,
    Packages:    api.PackagesExternal,
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```
:::

如若此配置，依赖包依然需要在运行时在文件系统中，即便他们已经不包含在打包中。
没有装esbuild
## 同步平台

在一个操作系统，拷贝`node_modules`目录到另一个操作系统上，而不重新安装，然后在这个另一个操作系统上运行esbuild，这是不行的。不能工作的原因是因为esbuild用原生代码实现，需要安装一个平台特制的二进制可执行文件。正常来说，这不是一个错误，因为往往检测到`package.json`文件归入版本控制，而不是`node_modules`目录，本地克隆下来仓库后，通常运行`npm install`。

然而，有时有这样的场景，在Windows或macOS上安装了esbuild，拷贝`node_modules`目录到一个运行在Linux的[Docker](https://www.docker.com/)镜像，或在Windows和[WSL](https://docs.microsoft.com/en-us/windows/wsl/)环境间拷贝`node_modules`目录。这种情况能不能工作取决于包管理器：

- **npm/pnpm**：如果用npm或pnpm安装的，不能拷贝`node_modules`目录，然后在目标平台上运行`npm ci`或`npm install`来达到目的。可以考虑使用内建了在多个平台同步功能的[Yarn](https://yarnpkg.com/)来替代。

- **Yarn**：如果用Yarn安装，可以在`.yarnrc.yml`文件中使用[`supportedArchitectures` 功能](https://yarnpkg.com/configuration/yarnrc/#supportedArchitectures)列出当前平台和其他平台。这也意味着文件系统上会存在有多个esbuild的拷贝。

也可能有这么种场景，在一个ARM处理器的macOS电脑上用ARM版本的npm安装esbuild，但esbuild运行在一个内部是[Rosetta](https://en.wikipedia.org/wiki/Rosetta_(software))的x86-64版本的node上。这种情况，一个简单的解决方案是，使用ARM版本的node来运行代码，这个版本安装地址：[https://nodejs.org/en/download/](https://nodejs.org/en/download/)。

另外一个处理方案是[使用`esbuild-wasm`包](./getting-started/#wasm)，它能以同样的方式在所有的平台上运行。但这会导致一个很大的性能花销，通常10倍慢于`esbuild`包，所以可能不是你想要的。

## 使用Yarn的Plug'n'Play

Yarn的[Plug'n'Play](https://yarnpkg.com/features/pnp/)包安装策略是被esbuild原生支持的。要用它，确保运行esbuild在包含Yarn的生成包清单JavaScript文件（要么是`.pnp.cjs`，要么为`.pnp.js`）的[当前工作目录](./api/#working-directory) 下。如果Yarn的Plug'n'Play包清单被检测到，esbuild将自动解析包引入到Yarn的包缓存的路径中的`.zip`文件，在打包中将自动提取这些文件。

因为esbuild是用Go写的，支持Yarn的Plug'n'Play，已经完全用Go重写，以替代依赖于Yarn的JavaScript API。这使得Yarn Plug'n'Play包解析能够与esbuild的完全并行打包管道很好地集成，以获得最大速度。注意，Yarn的命令行接口为每个命令添加了许多不可避免的性能开销。为了实现最大的esbuild性能，可以考虑用esbuild不带Yarn的CLI（也就是不用yarn esbuild）。这能使esbuild运行10倍快。

## Other ways to install

The recommended way to install esbuild is to [install the native executable using npm](#install-esbuild). But you can also install esbuild in these ways:

### Download a build

If you have a Unix system, you can use the following command to download the `esbuild` binary executable for your current platform (it will be downloaded to the current working directory):

```:no-line-numbers
curl -fsSL https://esbuild.github.io/dl/v0.17.18 | sh
```

You can also use `latest` instead of the version number to download the most recent version of esbuild:

```:no-line-numbers
curl -fsSL https://esbuild.github.io/dl/latest | sh
```

If you don't want to evaluate a shell script from the internet to download esbuild, you can also manually download the package from npm yourself instead (which is all the above shell script is doing). Although the precompiled native executables are hosted using npm, you don't actually need npm installed to download them. The npm package registry is a normal HTTP server and packages are normal gzipped tar files.

Here is an example of downloading a binary executable directly:

```bash $(1,3,5)
curl -O https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.17.18.tgz

tar xzf ./darwin-x64-0.17.18.tgz

./package/bin/esbuild
Usage:
  esbuild [options] [entry points]

...
```

The native executable in the `@esbuild/darwin-x64` package is for the macOS operating system and the 64-bit Intel architecture. As of writing, this is the full list of native executable packages for the platforms esbuild supports:

| Package name | OS | Architecture | Download |
| -------- | :------: | -----------: | -----: |
| [@esbuild/android-arm](https://www.npmjs.org/package/@esbuild/android-arm) | `android` | `arm` | [:arrow_down:](https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.17.18.tgz) |
| [@esbuild/android-arm64](https://www.npmjs.org/package/@esbuild/android-arm64) | `android` | `arm64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.17.18.tgz) |
| [@esbuild/android-x64](https://www.npmjs.org/package/@esbuild/android-x64) | `android` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.17.18.tgz) |
| [@esbuild/darwin-arm64](https://www.npmjs.org/package/@esbuild/darwin-arm64) | `darwin` | `arm64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.17.18.tgz) |
| [@esbuild/darwin-x64](https://www.npmjs.org/package/@esbuild/darwin-x64) | `darwin` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.17.18.tgz) |
| [@esbuild/freebsd-arm64](https://www.npmjs.org/package/@esbuild/freebsd-arm64) | `freebsd` | `arm64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.17.18.tgz) |
| [@esbuild/freebsd-x64](https://www.npmjs.org/package/@esbuild/freebsd-x64) | `freebsd` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.17.18.tgz) |
| [@esbuild/linux-arm](https://www.npmjs.org/package/@esbuild/linux-arm) | `linux` | `arm` | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.17.18.tgz) |
| [@esbuild/linux-arm64](https://www.npmjs.org/package/@esbuild/linux-arm64) | `linux` | `arm64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.17.18.tgz) |
| [@esbuild/linux-ia32](https://www.npmjs.org/package/@esbuild/linux-ia32) | `linux` | `ia32` | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.17.18.tgz) |
| [@esbuild/linux-loong64](https://www.npmjs.org/package/@esbuild/linux-loong64) | `linux` | `loong64`^2^ | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.17.18.tgz) |
| [@esbuild/linux-mips64el](https://www.npmjs.org/package/@esbuild/linux-mips64el) | `linux` | `mips64el`^2^ | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.17.18.tgz) |
| [@esbuild/linux-ppc64](https://www.npmjs.org/package/@esbuild/linux-ppc64) | `linux` | `ppc64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.17.18.tgz) |
| [@esbuild/linux-riscv64](https://www.npmjs.org/package/@esbuild/linux-riscv64) | `linux` | `riscv64`^2^ | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.17.18.tgz) |
| [@esbuild/linux-s390x](https://www.npmjs.org/package/@esbuild/linux-s390x) | `linux` | `s390x` | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.17.18.tgz) |
| [@esbuild/linux-x64](https://www.npmjs.org/package/@esbuild/linux-x64) | `linux` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.17.18.tgz) |
| [@esbuild/netbsd-x64](https://www.npmjs.org/package/@esbuild/netbsd-x64) | `netbsd`^1^ | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.17.18.tgz) |
| [@esbuild/openbsd-x64](https://www.npmjs.org/package/@esbuild/openbsd-x64) | `openbsd` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.17.18.tgz) |
| [@esbuild/sunos-x64](https://www.npmjs.org/package/@esbuild/sunos-x64) | `sunos` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.17.18.tgz) |
| [@esbuild/win32-arm64](https://www.npmjs.org/package/@esbuild/win32-arm64) | `win32` | `arm64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.17.18.tgz) |
| [@esbuild/win32-ia32](https://www.npmjs.org/package/@esbuild/win32-ia32) | `win32` | `ia32` | [:arrow_down:](https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.17.18.tgz) |
| [@esbuild/win32-x64](https://www.npmjs.org/package/@esbuild/win32-x64) | `win32` | `x64` | [:arrow_down:](https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.17.18.tgz) |

**Why this is not recommended**: This approach only works on Unix systems that can run shell scripts, so it will require [WSL](https://learn.microsoft.com/en-us/windows/wsl/) on Windows. An additional drawback is that you cannot use [plugins](./plugins/) with the native version of esbuild.

If you choose to write your own code to download esbuild directly from npm, then you are relying on internal implementation details of esbuild's native executable installer. These details may change at some point, in which case this approach will no longer work for new esbuild versions. This is only a minor drawback though since the approach should still work forever for existing esbuild versions (packages published to npm are immutable).

::: details 
- ^1^ This operating system is not on [node's list of supported platforms](https://nodejs.org/api/process.html#process_process_platform)
- ^2^ This architecture is not on [node's list of supported architectures](https://nodejs.org/api/process.html#processarch)
:::

### Install the WASM version

In addition to the `esbuild` npm package, there is also an `esbuild-wasm` package that functions similarly but that uses WebAssembly instead of native code. Installing it will also install an executable called `esbuild`:

```
npm install --save-exact esbuild-wasm
```

**Why this is not recommended**: The WebAssembly version is much, much slower than the native version. In many cases it is an order of magnitude (i.e. 10x) slower. This is for various reasons including a) node re-compiles the WebAssembly code from scratch on every run, b) Go's WebAssembly compilation approach is single-threaded, and c) node has WebAssembly bugs that can delay the exiting of the process by many seconds. The WebAssembly version also excludes some features such as the local file server. You should only use the WebAssembly package like this if there is no other option, such as when you want to use esbuild on an unsupported platform. The WebAssembly package is primarily intended to only be used [in the browser](./api#browser).

### Deno instead of node

There is also basic support for the [Deno](https://deno.land/) JavaScript environment if you'd like to use esbuild with that instead. The package is hosted at https://deno.land/x/esbuild and uses the native esbuild executable. The executable will be downloaded and cached from npm at run-time so your computer will need network access to registry.npmjs.org to make use of this package. Using the package looks like this:

```js
import * as esbuild from 'https://deno.land/x/esbuild@v0.17.18/mod.js'
let ts = 'let test: boolean = true'
let result = await esbuild.transform(ts, { loader: 'ts' })
console.log('result:', result)
esbuild.stop()
```

It has basically the same API as esbuild's npm package with one addition: you need to call `stop()` when you're done because unlike node, Deno doesn't provide the necessary APIs to allow Deno to exit while esbuild's internal child process is still running.

If you would like to use esbuild's WebAssembly implementation instead of esbuild's native implementation with Deno, you can do that by importing `wasm.js` instead of `mod.js` like this:

```js
import * as esbuild from 'https://deno.land/x/esbuild@v0.17.18/wasm.js'
let ts = 'let test: boolean = true'
let result = await esbuild.transform(ts, { loader: 'ts' })
console.log('result:', result)
esbuild.stop()
```

Using WebAssembly instead of native means you do not need to specify Deno's `--allow-run` permission, and WebAssembly the only option in situations where the file system is unavailable such as with [Deno Deploy](https://deno.com/deploy). However, keep in mind that the WebAssembly version of esbuild is a lot slower than the native version. Another thing to know about WebAssembly is that Deno currently has a bug where process termination is unnecessarily delayed until all loaded WebAssembly modules are fully optimized, which can take many seconds. You may want to manually call `Deno.exit(0)` after your code is done if you are writing a short-lived script that uses esbuild's WebAssembly implementation so that your code exits in a reasonable timeframe.

**Why this is not recommended**: Deno is newer than node, less widely used, and supports fewer platforms than node, so node is recommended as the primary way to run esbuild. Deno also uses the internet as a package system instead of existing JavaScript package ecosystems, and esbuild is designed around and optimized for npm-style package management. You should still be able to use esbuild with Deno, but you will need a plugin if you would like to be able to bundle HTTP URLs.

### Build from source

To build esbuild from source:

1. Install the Go compiler: 

https://go.dev/dl/

2. Download the source code for esbuild:

```
git clone --depth 1 --branch v0.17.18 https://github.com/evanw/esbuild.git
cd esbuild
```

3. Build the `esbuild` executable (it will be `esbuild.exe` on Windows):

```
go build ./cmd/esbuild
```

If you want to build for other platforms, you can just prefix the build command with the platform information. For example, you can build the 32-bit Linux version using this command:

```
GOOS=linux GOARCH=386 go build ./cmd/esbuild
```

**Why this is not recommended**: The native version can only be used via the command-line interface, which can be unergonomic for complex use cases and which does not support [plugins](./plugins). You will need to write JavaScript or Go code and use [esbuild's API](./api) to use plugins.
