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

## Benchmark details 性能测试详细信息

以下是关于每个性能测试的详细信息：

<figcaption style="text-align:center;margin:10px;">JavaScript 性能测试</figcaption>
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

这个性能测试通过复制[three.js](https://github.com/mrdoob/three.js)包来近似于一个大型JavaScript代码库10次，并从头开始构建单个打包，没有任何缓存。性能测试可以在[esbuild 仓库](https://github.com/evanw/esbuild)中使用`make bench-three`运行得到。

| **Bundler**  | **Time**    |  **Relative slowdown** | **Absolute speed** | **Output size** |
| ------------- | :-----------: | :-----------: | :-----------: | ----: |
| esbuild	 | 0.37s | 	1x | 	1479.6 kloc/s | 	5.80mb | 
| parcel 2 | 	30.50s | 	80x | 	17.9 kloc/s | 	5.87mb | 
| rollup + terser | 	32.07s | 	84x | 	17.1 kloc/s | 	5.81mb | 
| webpack 5 | 	39.70s | 	104x | 	13.8 kloc/s | 	5.84mb | 

每次报告都是三次运行中最好的一次。我正在使用`--bundle--minimy--sourcemap`运行esbuild。我使用了[`@rollup/plugin-terser`](https://github.com/rollup/plugins/tree/master/packages/terser)插件，因为rollup本身不支持缩小。Webpack 5使用`--mode=production --devtool=sourcemap`。Parcel 2使用默认选项。绝对速度基于包括评论和空行在内的总行数，目前为547,441。测试是在一款6核2019款MacBook Pro上进行的，该机型的RAM为16gb，[macOS Spotlight](https://en.wikipedia.org/wiki/Spotlight_(software))处于禁用状态。

<figcaption style="text-align:center;margin:10px;">TypeScript 性能测试</figcaption>
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

这个性能测试使用旧的[Rome](https://github.com/rome/tools)代码库（在Rust重写之前）来近似大型TypeScript代码库。所有代码必须组合到一个具有源码映射的缩小捆绑包中，并且生成的捆绑包必须正常工作。性能测试可以在[esbuild 仓库](https://github.com/evanw/esbuild)中使用`make bench-rome`运行得到。

| **Bundler**  | **Time**    |  **Relative slowdown** | **Absolute speed** | **Output size** |
| ------------- | :-----------: | :-----------: | :-----------: | ----: |
| esbuild	| 0.10s	| 1x	| 1318.4 kloc/s	| 0.97mb |
| parcel | 2	| 8.18s	| 82x	| 16.1 kloc/s	| 0.97mb |
| webpack | 5	| 15.96s	| 160x	| 8.3 kloc/s	| 1.27mb | 

每次报告都是三次运行中最好的一次。我正在使用`--bundle --minify --sourcemap --platform=node`运行esbuild。Webpack 5使用`transpileOnly: true`和`--mode=production --devtool=sourcemap`的ts加载程序。Parcel 2使用了`package.json`中的`"engines": "node"`。绝对速度基于包括注释和空行在内的总行数，目前为131,836。测试是在一款6核2019款MacBook Pro上进行的，该机型的RAM为16gb，[macOS Spotlight](https://en.wikipedia.org/wiki/Spotlight_(software))处于禁用状态。

结果不包括Rollup，因为由于与TypeScript编译有关的原因，我无法使其工作。我尝试了[`@rollup/plugin-typescript`](https://github.com/rollup/plugins/tree/master/packages/typescript)，但你不能禁用类型检查，我也尝试了[`@rollup/plugin-sucrase`](https://github.com/rollup/plugins/tree/master/packages/sucrase)，但无法提供`tsconfig.json`文件（这是正确路径解析所必需的）。

## 即将到来的路线图

这些功能已经在进行中，并且是首要任务：

- 代码拆分 ([#16](https://github.com/evanw/esbuild/issues/16), [文档](./api#spliting))
- CSS内容类型 ([#20](https://github.com/evanw/esbuild/issues/20), [文档](./content-types#css))
- 插件API ([#111](https://github.com/evanw/esbuild/issues/111))

这些是潜在的未来特征，但可能不会发生，也可能在更有限的范围内发生：


- HTML内容类型 ([#31](https://github.com/evanw/esbuild/issues/31))
- 下降至ES5 ([#297](https://github.com/evanw/esbuild/issues/297))
- 打包顶层 await ([#253](https://github.com/evanw/esbuild/issues/253))

在这一点之后，我将认为esbuild是相对完整的。我计划让esbuild达到一个基本稳定的状态，然后停止积累更多的功能。这将涉及对向esbuild本身添加主要功能的请求说“不”。我不认为esbuild应该成为满足所有前端需求的一体化解决方案。特别是，我想避免“webpack-config”模型带来的痛苦和问题，即底层工具过于灵活，易用性受到影响。

例如，我不打算在esbuild的核心中包含这些功能：

- 支持其他前端语言 (例如：[Elm](https://elm-lang.org/), [Svelte](https://svelte.dev/), [Vue](https://vuejs.org/), [Angular](https://angular.io/))
- TypeScript类型检查 (只需单独运行`tsc`)
- 用于自定义AST操作的API
- 热模块重新加载
- 模块联合

我希望我添加到esbuild中的扩展点（[plugins](./plugins/)和[API](./api/)）将使esbuilt成为更定制的构建工作流的一部分，但我并不打算或期望这些扩展点涵盖所有用例。如果您有非常自定义的需求，那么您应该使用其他工具。我还希望esbuild能激励其他构建工具通过彻底修改它们的实现来显著提高性能，这样每个人都能从中受益，而不仅仅是那些使用esbuild的人。

即使在esbuild达到稳定之后，我也计划继续维护esbuild现有范围内的所有内容。例如，这意味着实现对新发布的JavaScript和TypeScript语法功能的支持。

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
