# Getting Started

## Install esbuild

First, download and install the esbuild command locally. A prebuilt native executable can be installed using [npm](https://docs.npmjs.com/cli/v8/commands/npm-install) (which is automatically installed when you install the [node](https://nodejs.org/) JavaScript runtime):

```:no-line-numbers
npm install --save-exact esbuild
```

This should have installed esbuild in your local `node_modules` folder. You can run the esbuild executable to verify that everything is working correctly:

::: code-group

```bash:no-line-numbers [Unix]
./node_modules/.bin/esbuild --version
```

```cmd:no-line-numbers [Windows]
.\node_modules\.bin\esbuild --version
```

:::

The recommended way to install esbuild is to install the native executable using npm. But if you don't want to do that, there are also some [other ways to install](#other-ways-to-install).

## Your first bundle

This is a quick real-world example of what esbuild is capable of and how to use it. First, install the `react` and `react-dom` packages:

```:no-line-numbers
npm install react react-dom
```

Then create a file called `app.jsx` containing the following code:

```js
import * as React from 'react'
import * as Server from 'react-dom/server'

let Greet = () => <h1>Hello, world!</h1>
console.log(Server.renderToString(<Greet />))
```

Finally, tell esbuild to bundle the file:

::: code-group

```bash:no-line-numbers [Unix]
./node_modules/.bin/esbuild app.jsx --bundle --outfile=out.js
```

```cmd:no-line-numbers [Windows]
.\node_modules\.bin\esbuild app.jsx --bundle --outfile=out.js
```

:::

This should have created a file called `out.js` containing your code and the React library bundled together. The code is completely self-contained and no longer depends on your `node_modules` directory. If you run the code using `node out.js`, you should see something like this:

```html:no-line-numbers
<h1 data-reactroot="">Hello, world!</h1>
```

Notice that esbuild also converted JSX syntax to JavaScript without any configuration other than the `.jsx` extension. While esbuild can be configured, it attempts to have reasonable defaults so that many common situations work automatically. If you would like to use JSX syntax in `.js` files instead, you can tell esbuild to allow this using the `--loader:.js=jsx` flag. You can read more about the available configuration options in the [API documentation](./official/api).

## Build scripts

Your build command is something you will be running repeatedly, so you will want to automate it. A natural way of doing this is to add a build script to your `package.json` file like this:

```json
{
  "scripts": {
    "build": "esbuild app.jsx --bundle --outfile=out.js"
  }
}
```

Notice that this uses the `esbuild` command directly without a relative path. This works because everything in the `scripts` section is run with the `esbuild` command already in the path (as long as you have [installed the package](#install-esbuild)).

The build script can be invoked like this:

```:no-line-numbers
npm run build
```

However, using the command-line interface can become unwieldy if you need to pass many options to esbuild. For more sophisticated uses you will likely want to write a build script in JavaScript using esbuild's JavaScript API. That might look something like this (note that this code must be saved in a file with the `.mjs` extension because it uses the `import` keyword):

```js
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  outfile: 'out.js',
})
```

The `build` function runs the esbuild executable in a child process and returns a promise that resolves when the build is complete. There is also a `buildSync` API that is not asynchronous, but the asynchronous API is better for build scripts because [plugins](./official/plugins) only work with the asynchronous API. You can read more about the configuration options for the build API in the [API documentation](./official/api).

## Bundling for the browser

The bundler outputs code for the browser by default, so no additional configuration is necessary to get started. For development builds you probably want to enable [source maps](./official/api#source-map) with `--sourcemap`, and for production builds you probably want to enable [minification](./official/api#minify) with `--minify`. You probably also want to configure the [target](./official/api#target) environment for the browsers you support so that JavaScript syntax which is too new will be transformed into older JavaScript syntax. All of that might looks something like this:

::: code-group
```:no-line-numbers [CLI]
esbuild app.jsx --bundle --minify --sourcemap --target=chrome58,firefox57,safari11,edge16
```

```js{8} [JS]
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

```go{13-18} [Go]
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


Some npm packages you want to use may not be designed to be run in the browser. Sometimes you can use esbuild's configuration options to work around certain issues and successfully bundle the package anyway. Undefined globals can be replaced with either the [define](./official/api#define) feature in simple cases or the [inject](./official/api#inject) feature in more complex cases.

## Bundling for node

Even though a bundler is not necessary when using node, sometimes it can still be beneficial to process your code with esbuild before running it in node. Bundling can automatically strip TypeScript types, convert ECMAScript module syntax to CommonJS, and transform newer JavaScript syntax into older syntax for a specific version of node. And it may be beneficial to bundle your package before publishing it so that it's a smaller download and so it spends less time reading from the file system when being loaded.

If you are bundling code that will be run in node, you should configure the [platform](./official/api#platform) setting by passing `--platform=node` to esbuild. This simultaneously changes a few different settings to node-friendly default values. For example, all packages that are built-in to node such as fs are automatically marked as external so esbuild doesn't try to bundle them. This setting also disables the interpretation of the browser field in `package.json`.

If your code uses newer JavaScript syntax that doesn't work in your version of node, you will want to configure the [target](./official/api#target) version of node:

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

You also may not want to bundle your dependencies with esbuild. There are many node-specific features that esbuild doesn't support while bundling such as `__dirname`, `import.meta.url`, `fs.readFileSync`, and `*.node` native binary modules. You can exclude all of your dependencies from the bundle by setting [packages](./official/api#packages) to external:

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

If you do this, your dependencies must still be present on the file system at run-time since they are no longer included in the bundle.

## Simultaneous platforms

You cannot install esbuild on one OS, copy the `node_modules` directory to another OS without reinstalling, and then run esbuild on that other OS. This won't work because esbuild is written with native code and needs to install a platform-specific binary executable. Normally this isn't an issue because you typically check your `package.json` file into version control, not your `node_modules` directory, and then everyone runs `npm install` on their local machine after cloning the repository.

However, people sometimes get into this situation by installing esbuild on Windows or macOS and copying their `node_modules` directory into a [Docker](https://www.docker.com/) image that runs Linux, or by copying their `node_modules` directory between Windows and [WSL](https://docs.microsoft.com/en-us/windows/wsl/) environments. The way to get this to work depends on your package manager:

- **npm/pnpm**: If you are installing with npm or pnpm, you can try not copying the `node_modules` directory when you copy the files over, and running `npm ci` or `npm install` on the destination platform after the copy. Or you could consider using [Yarn](https://yarnpkg.com/) instead which has built-in support for installing a package on multiple platforms simultaneously.

- **Yarn**: If you are installing with Yarn, you can try listing both this platform and the other platform in your `.yarnrc.yml` file using the [`supportedArchitectures` feature](https://yarnpkg.com/configuration/yarnrc/#supportedArchitectures). Keep in mind that this means multiple copies of esbuild will be present on the file system.

You can also get into this situation on a macOS computer with an ARM processor if you install esbuild using the ARM version of npm but then try to run esbuild with the x86-64 version of node running inside of [Rosetta](https://en.wikipedia.org/wiki/Rosetta_(software)). In that case, an easy fix is to run your code using the ARM version of node instead, which can be downloaded here: [https://nodejs.org/en/download/](https://nodejs.org/en/download/).

Another alternative is to [use the `esbuild-wasm` package instead](./official/getting-started/#wasm), which works the same way on all platforms. But it comes with a heavy performance cost and can sometimes be 10x slower than the `esbuild` package, so you may also not want to do that.

## Using Yarn Plug'n'Play

Yarn's [Plug'n'Play](https://yarnpkg.com/features/pnp/) package installation strategy is supported natively by esbuild. To use it, make sure you are running esbuild such that the [current working directory](./official/api/#working-directory) contains Yarn's generated package manifest JavaScript file (either `.pnp.cjs` or `.pnp.js`). If a Yarn Plug'n'Play package manifest is detected, esbuild will automatically resolve package imports to paths inside the `.zip` files in Yarn's package cache, and will automatically extract these files on the fly during bundling.

Because esbuild is written in Go, support for Yarn Plug'n'Play has been completely re-implemented in Go instead of relying on Yarn's JavaScript API. This allows Yarn Plug'n'Play package resolution to integrate well with esbuild's fully parallelized bundling pipeline for maximum speed. Note that Yarn's command-line interface adds a lot of unavoidable performance overhead to every command. For maximum esbuild performance, you may want to consider running esbuild without using Yarn's CLI (i.e. not using yarn esbuild). This can result in esbuild running 10x faster.

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

**Why this is not recommended**: This approach only works on Unix systems that can run shell scripts, so it will require [WSL](https://learn.microsoft.com/en-us/windows/wsl/) on Windows. An additional drawback is that you cannot use [plugins](./official/plugins/) with the native version of esbuild.

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

**Why this is not recommended**: The WebAssembly version is much, much slower than the native version. In many cases it is an order of magnitude (i.e. 10x) slower. This is for various reasons including a) node re-compiles the WebAssembly code from scratch on every run, b) Go's WebAssembly compilation approach is single-threaded, and c) node has WebAssembly bugs that can delay the exiting of the process by many seconds. The WebAssembly version also excludes some features such as the local file server. You should only use the WebAssembly package like this if there is no other option, such as when you want to use esbuild on an unsupported platform. The WebAssembly package is primarily intended to only be used [in the browser](./official/api#browser).

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

**Why this is not recommended**: The native version can only be used via the command-line interface, which can be unergonomic for complex use cases and which does not support [plugins](./official/plugins). You will need to write JavaScript or Go code and use [esbuild's API](./official/api) to use plugins.
