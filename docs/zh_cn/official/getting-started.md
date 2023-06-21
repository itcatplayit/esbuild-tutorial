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

## 其他安装方法

安装esbuild的推荐方式为[使用npm安装本地可执行文件](#install-esbuild)。也还有其他安装方式：

### 下载构建版

如果是在Unix系统，可以使用下面的命令为你当前的平台（它将安装在当前工作目录下）下载`esbuild`二进制可执行文件：

```:no-line-numbers
curl -fsSL https://esbuild.github.io/dl/v0.17.18 | sh
```

可以用`latest`替代版本数字来下载最近的esbuild版本：

```:no-line-numbers
curl -fsSL https://esbuild.github.io/dl/latest | sh
```

如果不想通过shell脚本从网上下载esbuild，可以手动从npm手动下载包（也就是上面shell脚本做的事）。尽管预编译的本地可执行文件是使用npm托管的，但下载它们实际上并不需要安装npm。npm包注册中心是一个通常的HTTP服务器，包也是通常的压缩tar文件。

下面是一个直接下载二进制可执行文件的例子：

```bash $(1,3,5)
curl -O https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.17.18.tgz

tar xzf ./darwin-x64-0.17.18.tgz

./package/bin/esbuild
Usage:
  esbuild [options] [entry points]

...
```

在`@esbuild/darwin-x64`包中的原生可执行文件是为macOS操作系统和64位Intel架构的。下面列出了esbuild支持的平台的所有原生可执行文件包：

| 包名 | 操作系统 | 架构 | 下载 |
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

**为什么不推荐这种方式**：这种方法只能工作在能运行shell脚本的Unix系统上，所以Windows系统上需要有[WSL](https://learn.microsoft.com/en-us/windows/wsl/)。一个附带的缺点是不能使用原生版的esbuild[插件](./plugins/)。

如果直接从npm选择编写自己的代码来下载esbuild，那么依赖esbuild的原生可执行安装包的网络实现细节。这些细节可能在某些点上有变化，也就是这种方法在新esbuild版可能不再工作。不过，这只是一个小缺点，因为该方法应该仍然适用于现有的esbuild版本（发布了的包是不会变的）。

::: details 标注详情 
- ^1^ 这个操作系统不在[node支持的平台列表中](https://nodejs.org/api/process.html#process_process_platform)
- ^2^ 这个架构不在[node支持的架构列表中](https://nodejs.org/api/process.html#processarch)
:::

### 安装WASM版本

除了`esbuild` npm包外，还有函数基本相同，但不是用原生代码，而是用WebAssembly代码的`esbuild-wasm`包。安装了还会安装一个可执行的`esbuild`可执行文件。

```
npm install --save-exact esbuild-wasm
```

**为什么不推荐**：WebAssembly版本比原生版本慢得多。很多情况下会是倍速级（例如：10倍）的慢。这包括很多原因：a） 节点在每次运行时从头开始重新编译WebAssembly代码；b）Go的WebAssembly编译方法是单线程的；c）节点存在WebAssembly错误，这些错误可能会将进程的退出延迟数秒。WebAssembly版本还排除了一些功能，例如本地文件服务器。只有在没有其他选项的情况下，例如当您想在不受支持的平台上使用esbuild时，才应该像这样使用WebAssembly包。WebAssembly包主要用于[浏览器端](./api#browser)。

### 不用node用Deno

如果您想将esbuild与Deno JavaScript环境一起使用，那么它还提供了对[Deno](https://deno.land/) JavaScript环境的基本支持。程序包托管在 https://deno.land/x/esbuild ，并使用原生esbuild可执行文件。可执行文件将在运行时从npm下载并缓存，因此您的计算机需要通过网络访问 registry.npmjs.org 才能使用此包。使用该包如下所示：

```js
import * as esbuild from 'https://deno.land/x/esbuild@v0.17.18/mod.js'
let ts = 'let test: boolean = true'
let result = await esbuild.transform(ts, { loader: 'ts' })
console.log('result:', result)
esbuild.stop()
```

它基本上与esbuild的npm包具有相同的API，只有一点额外：完成后跟node不同，需要调用`stop()`，Deno不提供必要的API来允许Deno在esbuilt的内部子进程仍在运行时退出。

如果您想使用esbuild的WebAssembly实现，而不是使用带有Deno的esbuild原生实现，可以通过导入`wasm.js`而不是`mod.js`来实现，如下所示：

```js
import * as esbuild from 'https://deno.land/x/esbuild@v0.17.18/wasm.js'
let ts = 'let test: boolean = true'
let result = await esbuild.transform(ts, { loader: 'ts' })
console.log('result:', result)
esbuild.stop()
```

使用WebAssembly而不是原生意味着您不需要指定Deno的`--allow-run`权限，并且在文件系统不可用的情况下，如[Deno部署](https://deno.com/deploy)，WebAssembly是唯一的选项。但是，请记住，esbuild的WebAssembly版本比原生版本慢得多。关于WebAssembly需要知道的另一件事是，Deno目前存在一个错误，即进程终止被不必要地延迟，直到所有加载的WebAssembly模块都得到完全优化，这可能需要几秒钟的时间。如果您正在编写一个使用esbuild的WebAssembly实现的短周期脚本，以便您的代码在合理的时间内退出，那么您可能需要在代码完成后手动调用`Deno.exit(0)`。

**为什么不建议这样做**：Deno比node更新，使用较少，支持的平台比node少，因此建议将node作为运行esbuild的主要方式。Deno还使用互联网作为包系统，而不是现有的JavaScript包生态系统，esbuild是围绕npm风格的包管理设计和优化的。您应该仍然能够将esbuild与Deno一起使用，但如果您希望能够打包HTTP URL，则需要一个插件。

### 从源码构建

从源码构建方法：

1. 安装Go编译器：

https://go.dev/dl/

2. 下载esbuild源码：

```
git clone --depth 1 --branch v0.17.18 https://github.com/evanw/esbuild.git
cd esbuild
```

3. 构建`esbuild`可执行文件（Windows下为`esbuild.exe`文件）：

```
go build ./cmd/esbuild
```

如果想要构建其他平台的，只需要在平台信息中添加构建命令的前缀。例如，可以用如下方式构建32位Linux版本：

```
GOOS=linux GOARCH=386 go build ./cmd/esbuild
```

**为什么不建议这样做**: 本机版本只能通过命令行界面使用，对于复杂的用例，命令行界面可能不符合逻辑，并且不支持[插件](./plugins)。您需要编写JavaScript或Go代码，并使用[esbuild的API](./api)来使用插件。
