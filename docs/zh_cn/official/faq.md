# 常见问题回答

这是关于esbuild常见问题的收集。可以在[GitHub 问题追踪](https://github.com/evanw/esbuild/issues)上问问题。

[[toc]]

## 为什么esbuild很快？

几个原因：

- 用[Go](https://go.dev/)写的，编译成原生代码。

很多其他打包器用JavaScript写的，但是命令行应用是一个对JIT编译语言的最坏性能的情况。每次运行打包器，第一次看到您的打包代码，JavaScript VM没有任何优化提示。当esbuild忙于解析您的JavaScript时，node忙于解析打包的JavaScript。当节点完成对打包代码的解析时，esbuild可能已经退出，而打包器甚至还没有开始绑定。

此外，Go是为并行性而从核心设计的，而JavaScript则不是。Go在线程之间共享内存，而JavaScript必须在线程之间序列化数据。Go和JavaScript都有并行的垃圾收集器，但Go的堆在所有线程之间共享，而JavaScript每个JavaScript线程都有一个单独的堆。这似乎将JavaScript工作线程的并行性减半[根据我的测试](https://github.com/evanw/esbuild/issues/111#issuecomment-719910381)，大概是因为一半的CPU核心正忙于为另一半收集垃圾。

- 并行性被大量使用。

esbuild中的算法经过精心设计，尽可能使所有可用的CPU内核完全饱和。大致有三个阶段：解析、链接和代码生成。解析和代码生成是大部分工作，并且是完全可并行的（在大多数情况下，链接本质上是一项串行任务）。由于所有线程都共享内存，所以当打包导入相同JavaScript库的不同入口点时，可以很容易地共享工作。大多数现代计算机都有多核，因此并行性是一大优势。

- esbuild中的所有内容都是从头开始编写的。

自己编写所有内容而不是使用第三方库有很多性能优势。您可以从一开始就考虑性能，可以确保所有内容都使用一致的数据结构来避免昂贵的转换，并且可以在必要时进行广泛的架构更改。缺点当然是工作量很大。

例如，许多打包器使用官方的TypeScript编译器作为解析器。但它是为实现TypeScript编译器团队的目标而构建的，他们并不把性能作为首要任务。他们的代码大量使用了[超变形物体形状](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html)和[不必要的动态属性访问](https://github.com/microsoft/TypeScript/issues/39247)（都是众所周知的JavaScript减速带）。而且，即使类型检查被禁用，TypeScript解析器似乎仍然运行类型检查器。这些都不是esbuild的自定义TypeScript解析器的问题。

- 内存被有效利用。

理想情况下，编译器的输入长度大多为O(n)复杂度。因此，如果您正在处理大量数据，内存访问速度可能会严重影响性能。对数据进行的传递次数越少（将数据转换为不同的表示形式所需的次数也越少），编译器的运行速度就越快。

例如，esbuild只接触整个JavaScript AST三次：

- 1. 词法分析、解析、作用域设置和声明符号的过程
- 2. 打包符号、缩小语法、JSX/TS到JS以及ESNext到ES215的过程
- 3. 用于缩小标识符、缩小空白、生成代码和生成源码映射的过程

这最大限度地提高了AST数据在CPU缓存中仍然处于热状态时的重用率。其他打包器在单独的通道中完成这些步骤，而不是交错进行。它们还可以在数据表示之间进行转换，以将多个库粘合在一起（例如string→TS→JS→string，然后string→JS→旧JS→string，然后string→JS→minified JS→string），这会使用更多的内存并减慢速度。

Go的另一个好处是，它可以将东西紧凑地存储在内存中，这使它能够使用更少的内存，并在CPU缓存中容纳更多的内存。所有对象字段都有类型，并且字段被紧密地打包在一起，因此例如，几个布尔标志每个只占用一个字节。Go还具有值语义，可以将一个对象直接嵌入到另一个对象中，因此它“免费”出现，而无需另一个分配。JavaScript没有这些功能，也有其他缺点，如JIT开销（例如隐藏类槽）和低效表示（例如非整数是用指针堆分配的）。

这些因素中的每一个都只是一个显著的加速，但它们加在一起可以产生比当今常用的其他打包器快几个数量级的打包器。

## Benchmark details

Here are the details about each benchmark:

<figcaption style="text-align:center;margin:10px;">JavaScript benchmark</figcaption>
<figure class="bench" style="position:relative;max-width:800px;height:110px;font-size:13px;line-height:20px;">
  <div style="position:absolute;left:120px;top:0;right:0;height:80px;">
    <div style="position:absolute;left:0.00%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:21.48%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:42.97%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:64.45%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:85.94%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:0;top:3px;width:0.79%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:3px;width:0.79%;height:14px;background:#FFCF00;" class="bench0-bar0"></div>
    <div style="position:absolute;right:100%;top:0px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;font-weight:bold;">
      <a href="https://esbuild.github.io/">esbuild</a>
    </div>
    <div style="position:absolute;left:0.79%;top:0px;height:20px;margin-left:8px;font-weight:bold;">0.37s</div>
    <div style="position:absolute;left:0;top:23px;width:65.53%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:23px;width:65.53%;height:14px;background:#FFCF00;" class="bench0-bar1"></div>
    <div style="position:absolute;right:100%;top:20px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
      <a href="https://parceljs.org/">parcel 2</a>
    </div>
    <div style="position:absolute;left:65.53%;top:20px;height:20px;margin-left:8px;">30.50s</div>
    <div style="position:absolute;left:0;top:43px;width:68.90%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:43px;width:68.90%;height:14px;background:#FFCF00;" class="bench0-bar2"></div>
    <div style="position:absolute;right:100%;top:40px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
      <a href="https://rollupjs.org/">rollup</a> + <a href="https://terser.org/">terser</a>
    </div>
    <div style="position:absolute;left:68.90%;top:40px;height:20px;margin-left:8px;">32.07s</div>
    <div style="position:absolute;left:0;top:63px;width:85.29%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:63px;width:85.29%;height:14px;background:#FFCF00;" class="bench0-bar3"></div>
    <div style="position:absolute;right:100%;top:60px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
    <a href="https://webpack.js.org/">webpack 5</a></div><div style="position:absolute;left:85.29%;top:60px;height:20px;margin-left:8px;">39.70s</div>
    <div style="position:absolute;left:0.00%;top:84px;width:50px;margin-left:-25px;text-align:center;">0s</div>
    <div style="position:absolute;left:21.48%;top:84px;width:50px;margin-left:-25px;text-align:center;">10s</div>
    <div style="position:absolute;left:42.97%;top:84px;width:50px;margin-left:-25px;text-align:center;">20s</div>
    <div style="position:absolute;left:64.45%;top:84px;width:50px;margin-left:-25px;text-align:center;">30s</div>
    <div style="position:absolute;left:85.94%;top:84px;width:50px;margin-left:-25px;text-align:center;">40s</div>
  </div>
</figure>

This benchmark approximates a large JavaScript codebase by duplicating the [three.js](https://github.com/mrdoob/three.js) library 10 times and building a single bundle from scratch, without any caches. The benchmark can be run with `make bench-three` in the [esbuild repo](https://github.com/evanw/esbuild).

| **Bundler**  | **Time**    |  **Relative slowdown** | **Absolute speed** | **Output size** |
| ------------- | :-----------: | :-----------: | :-----------: | ----: |
| esbuild	 | 0.37s | 	1x | 	1479.6 kloc/s | 	5.80mb | 
| parcel 2 | 	30.50s | 	80x | 	17.9 kloc/s | 	5.87mb | 
| rollup + terser | 	32.07s | 	84x | 	17.1 kloc/s | 	5.81mb | 
| webpack 5 | 	39.70s | 	104x | 	13.8 kloc/s | 	5.84mb | 

Each time reported is the best of three runs. I'm running esbuild with `--bundle --minify --sourcemap`. I used the [`@rollup/plugin-terser`](https://github.com/rollup/plugins/tree/master/packages/terser) plugin because Rollup itself doesn't support minification. Webpack 5 uses `--mode=production --devtool=sourcemap`. Parcel 2 uses the default options. Absolute speed is based on the total line count including comments and blank lines, which is currently 547,441. The tests were done on a 6-core 2019 MacBook Pro with 16gb of RAM and with [macOS Spotlight](https://en.wikipedia.org/wiki/Spotlight_(software)) disabled.

<figcaption style="text-align:center;margin:10px;">TypeScript benchmark</figcaption>
<figure class="bench" style="position:relative;max-width:800px;height:90px;font-size:13px;line-height:20px;">
  <div style="position:absolute;left:120px;top:0;right:0;height:60px;">
    <div style="position:absolute;left:0.00%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:26.72%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:53.44%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:80.16%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
    <div style="position:absolute;left:0;top:3px;width:0.53%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:3px;width:0.53%;height:14px;background:#FFCF00;" class="bench1-bar0"></div>
    <div style="position:absolute;right:100%;top:0px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;font-weight:bold;">
      <a href="https://esbuild.github.io/">esbuild</a>
    </div>
    <div style="position:absolute;left:0.53%;top:0px;height:20px;margin-left:8px;font-weight:bold;">0.10s</div>
    <div style="position:absolute;left:0;top:23px;width:43.72%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:23px;width:43.72%;height:14px;background:#FFCF00;" class="bench1-bar1"></div>
    <div style="position:absolute;right:100%;top:20px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
      <a href="https://parceljs.org/">parcel 2</a>
    </div>
    <div style="position:absolute;left:43.72%;top:20px;height:20px;margin-left:8px;">8.18s</div>
    <div style="position:absolute;left:0;top:43px;width:85.29%;height:14px;background:rgba(191,191,191,0.2);"></div>
    <div style="position:absolute;left:0;top:43px;width:85.29%;height:14px;background:#FFCF00;" class="bench1-bar2"></div>
    <div style="position:absolute;right:100%;top:40px;width:120px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
      <a href="https://webpack.js.org/">webpack 5</a>
    </div>
    <div style="position:absolute;left:85.29%;top:40px;height:20px;margin-left:8px;">15.96s</div>
    <div style="position:absolute;left:0.00%;top:64px;width:50px;margin-left:-25px;text-align:center;">0s</div>
    <div style="position:absolute;left:26.72%;top:64px;width:50px;margin-left:-25px;text-align:center;">5s</div>
    <div style="position:absolute;left:53.44%;top:64px;width:50px;margin-left:-25px;text-align:center;">10s</div>
    <div style="position:absolute;left:80.16%;top:64px;width:50px;margin-left:-25px;text-align:center;">15s</div>
  </div>
</figure>

This benchmark uses the old [Rome](https://github.com/rome/tools) code base (prior to their Rust rewrite) to approximate a large TypeScript codebase. All code must be combined into a single minified bundle with source maps and the resulting bundle must work correctly. The benchmark can be run with `make bench-rome` in the [esbuild repo](https://github.com/evanw/esbuild).

| **Bundler**  | **Time**    |  **Relative slowdown** | **Absolute speed** | **Output size** |
| ------------- | :-----------: | :-----------: | :-----------: | ----: |
| esbuild	| 0.10s	| 1x	| 1318.4 kloc/s	| 0.97mb |
| parcel | 2	| 8.18s	| 82x	| 16.1 kloc/s	| 0.97mb |
| webpack | 5	| 15.96s	| 160x	| 8.3 kloc/s	| 1.27mb | 


Each time reported is the best of three runs. I'm running esbuild with `--bundle --minify --sourcemap --platform=node`. Webpack 5 uses [`ts-loader`](https://github.com/TypeStrong/ts-loader) with `transpileOnly: true` and `--mode=production --devtool=sourcemap`. Parcel 2 uses `"engines": "node"` in `package.json`. Absolute speed is based on the total line count including comments and blank lines, which is currently 131,836. The tests were done on a 6-core 2019 MacBook Pro with 16gb of RAM and with [macOS Spotlight](https://en.wikipedia.org/wiki/Spotlight_(software)) disabled.

The results don't include Rollup because I couldn't get it to work for reasons relating to TypeScript compilation. I tried [`@rollup/plugin-typescript`](https://github.com/rollup/plugins/tree/master/packages/typescript) but you can't disable type checking, and I tried [`@rollup/plugin-sucrase`](https://github.com/rollup/plugins/tree/master/packages/sucrase) but there's no way to provide a `tsconfig.json` file (which is required for correct path resolution).

## Upcoming roadmap

These features are already in progress and are first priority:

- Code splitting ([#16](https://github.com/evanw/esbuild/issues/16), [docs](./api#spliting))
- CSS content type ([#20](https://github.com/evanw/esbuild/issues/20), [docs](./content-types#css))
- Plugin API ([#111](https://github.com/evanw/esbuild/issues/111))

These are potential future features but may not happen or may happen to a more limited extent:

- HTML content type ([#31](https://github.com/evanw/esbuild/issues/31))
- Lowering to ES5 ([#297](https://github.com/evanw/esbuild/issues/297))
- Bundling top-level await ([#253](https://github.com/evanw/esbuild/issues/253))

After that point, I will consider esbuild to be relatively complete. I'm planning for esbuild to reach a mostly stable state and then stop accumulating more features. This will involve saying "no" to requests for adding major features to esbuild itself. I don't think esbuild should become an all-in-one solution for all frontend needs. In particular, I want to avoid the pain and problems of the "webpack config" model where the underlying tool is too flexible and usability suffers.

For example, I am not planning to include these features in esbuild's core itself:

- Support for other frontend languages (e.g. [Elm](https://elm-lang.org/), [Svelte](https://svelte.dev/), [Vue](https://vuejs.org/), [Angular](https://angular.io/))
- TypeScript type checking (just run `tsc` separately)
- An API for custom AST manipulation
- Hot-module reloading
- Module federation

I hope that the extensibility points I'm adding to esbuild ([plugins](./plugins/) and the [API](./api/)) will make esbuild useful to include as part of more customized build workflows, but I'm not intending or expecting these extensibility points to cover all use cases. If you have very custom requirements then you should be using other tools. I also hope esbuild inspires other build tools to dramatically improve performance by overhauling their implementations so that everyone can benefit, not just those that use esbuild.

I am planning to continue to maintain everything in esbuild's existing scope even after esbuild reaches stability. This means implementing support for newly-released JavaScript and TypeScript syntax features, for example.

## Production readiness

This project has not yet hit version 1.0.0 and is still in active development. That said, it is far beyond the alpha stage and is pretty stable. I think of it as a late-stage beta. For some early-adopters that means it's good enough to use for real things. Some other people think this means esbuild isn't ready yet. This section doesn't try to convince you either way. It just tries to give you enough information so you can decide for yourself whether you want to use esbuild as your bundler.

Some data points:

- **Used by other projects**

  The API is already being used as a library within many other developer tools. For example, [Vite](https://vitejs.dev/) and [Snowpack](https://www.snowpack.dev/) are using esbuild to transform TypeScript into JavaScript and [Amazon CDK](https://aws.amazon.com/cdk/) (Cloud Development Kit) and [Phoenix](https://www.phoenixframework.org/) are using esbuild to bundle code.

- **API stability**

  Even though esbuild's version is not yet 1.0.0, effort is still made to keep the API stable. Patch versions are intended for backwards-compatible changes and minor versions are intended for backwards-incompatible changes. If you plan to use esbuild for something real, you should either pin the exact version (maximum safety) or pin the major and minor versions (only accept backwards-compatible upgrades).

- **Only one main developer**

  This tool is primarily built by [me](https://github.com/evanw). For some people this is fine, but for others this means esbuild is not a suitable tool for their organization. That's ok with me. I'm building esbuild because I find it fun to build and because it's the tool I'd want to use. I'm sharing it with the world because there are others that want to use it too, because the feedback makes the tool itself better, and because I think it will inspire the ecosystem to make better tools.

- **Not always open to scope expansion**

  I'm not planning on including major features that I'm not interested in building and/or maintaining. I also want to limit the project's scope so it doesn't get too complex and unwieldy, both from an architectural perspective, a testing and correctness perspective, and from a usability perspective. Think of esbuild as a "linker" for the web. It knows how to transform and bundle JavaScript and CSS. But the details of how your source code ends up as plain JavaScript or CSS may need to be 3rd-party code.

  I'm hoping that [plugins](./plugins/) will allow the community to add major features (e.g. WebAssembly import) without needing to contribute to esbuild itself. However, not everything is exposed in the plugin API and it may be the case that it's not possible to add a particular feature to esbuild that you may want to add. This is intentional; esbuild is not meant to be an all-in-one solution for all frontend needs.

## Anti-virus software

Since esbuild is written in native code, anti-virus software can sometimes incorrectly flag it as a virus. *This does not mean esbuild is a virus*. I do not publish malicious code and I take supply chain security very seriously.

Virtually all of esbuild's code is first-party code except for [one dependency](https://github.com/evanw/esbuild/blob/main/go.mod) on Google's set of supplemental Go packages. My development work is done on different machine that is isolated from the one I use to publish builds. I have done additional work to ensure that esbuild's published builds are completely reproducible and after every release, published builds are [automatically compared](https://github.com/evanw/esbuild/blob/main/.github/workflows/validate.yml) to ones locally-built in an unrelated environment to ensure that they are bitwise identical (i.e. that the Go compiler itself has not been compromised). You can also build esbuild from source yourself and compare your build artifacts to the published ones to independently verify this.

Having to deal with false-positives is an unfortunate reality of using anti-virus software. Here are some possible workarounds if your anti-virus won't let you use esbuild:

- Ignore your anti-virus software and remove esbuild from quarantine
- Report the specific esbuild native executable as a false-positive to your anti-virus software vendor
- Use [`esbuild-wasm`](./getting-started#install-the-wasm-version) instead of `esbuild` to bypass your anti-virus software (which likely won't flag WebAssembly files the same way it flags native executables)
- Use another build tool instead of esbuild

## Minified newlines

People are sometimes surprised that esbuild's minifier typically changes the character escape sequence `\n` within JavaScript strings into a newline character in a template literal. But this is intentional. **This is not a bug with esbuild**. The job of a minifier is to generate as compact an output as possible that's equivalent to the input. The character escape sequence `\n` is two bytes long while a newline character is one byte long.

For example, this code is 21 bytes long:

```js
var text="a\nb\nc\n";
```

While this code is 18 bytes long:

```js
var text=`a
b
c
`;
```

So the second code is fully minified while the first one isn't. Minifying code does not mean putting it all on one line. Instead, minifying code means generating equivalent code that uses as few bytes as possible. In JavaScript, an untagged template literal is equivalent to a string literal, so esbuild is doing the correct thing here.
