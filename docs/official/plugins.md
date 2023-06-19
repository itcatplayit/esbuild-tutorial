# Plugins

The plugin API allows you to inject code into various parts of the build process. Unlike the rest of the API, it's not available from the command line. You must write either JavaScript or Go code to use the plugin API. Plugins can also only be used with the [build](./api/#build) API, not with the [transform](./api/#transform) API.

## Finding plugins

If you're looking for an existing esbuild plugin, you should check out the [list of existing esbuild plugins](https://github.com/esbuild/community-plugins). Plugins on this list have been deliberately added by the author and are intended to be used by others in the esbuild community.

If you want to share your esbuild plugin, you should:

  1. [Publish it to npm](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages) so others can install it.
  2. Add it to the [list of existing esbuild plugins](https://github.com/esbuild/community-plugins) so others can find it.

## Using plugins

An esbuild plugin is an object with a `name` and a `setup` function. They are passed in an array to the [build](./api/#build) API call. The `setup` function is run once for each build API call.

Here's a simple plugin example that allows you to import the current environment variables at build time:

::: code-group

```js [JS]
import * as esbuild from 'esbuild'

let envPlugin = {
  name: 'env',
  setup(build) {
    // Intercept import paths called "env" so esbuild doesn't attempt
    // to map them to a file system location. Tag them with the "env-ns"
    // namespace to reserve them for this plugin.
    build.onResolve({ filter: /^env$/ }, args => ({
      path: args.path,
      namespace: 'env-ns',
    }))

    // Load paths tagged with the "env-ns" namespace and behave as if
    // they point to a JSON file containing the environment variables.
    build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => ({
      contents: JSON.stringify(process.env),
      loader: 'json',
    }))
  },
}

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  outfile: 'out.js',
  plugins: [envPlugin],
})
```

```go [Go]
package main

import "encoding/json"
import "os"
import "strings"
import "github.com/evanw/esbuild/pkg/api"

var envPlugin = api.Plugin{
  Name: "env",
  Setup: func(build api.PluginBuild) {
    // Intercept import paths called "env" so esbuild doesn't attempt
    // to map them to a file system location. Tag them with the "env-ns"
    // namespace to reserve them for this plugin.
    build.OnResolve(api.OnResolveOptions{Filter: `^env$`},
      func(args api.OnResolveArgs) (api.OnResolveResult, error) {
        return api.OnResolveResult{
          Path:      args.Path,
          Namespace: "env-ns",
        }, nil
      })

    // Load paths tagged with the "env-ns" namespace and behave as if
    // they point to a JSON file containing the environment variables.
    build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "env-ns"},
      func(args api.OnLoadArgs) (api.OnLoadResult, error) {
        mappings := make(map[string]string)
        for _, item := range os.Environ() {
          if equals := strings.IndexByte(item, '='); equals != -1 {
            mappings[item[:equals]] = item[equals+1:]
          }
        }
        bytes, err := json.Marshal(mappings)
        if err != nil {
          return api.OnLoadResult{}, err
        }
        contents := string(bytes)
        return api.OnLoadResult{
          Contents: &contents,
          Loader:   api.LoaderJSON,
        }, nil
      })
  },
}

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Bundle:      true,
    Outfile:     "out.js",
    Plugins:     []api.Plugin{envPlugin},
    Write:       true,
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

You would use it like this:

```js
import { PATH } from 'env'
console.log(`PATH is ${PATH}`)
```

## Concepts

Writing a plugin for esbuild works a little differently than writing a plugin for other bundlers. The concepts below are important to understand before developing your plugin:

### Namespaces

Every module has an associated namespace. By default esbuild operates in the `file` namespace, which corresponds to files on the file system. But esbuild can also handle "virtual" modules that don't have a corresponding location on the file system. One case when this happens is when a module is provided using [stdin](./api/#stdin).

Plugins can be used to create virtual modules. Virtual modules usually use a namespace other than `file` to distinguish them from file system modules. Usually the namespace is specific to the plugin that created them. For example, the sample [HTTP plugin](./plugins/#http-plugin) below uses the `http-url` namespace for downloaded files.

### Filters

Every callback must provide a regular expression as a filter. This is used by esbuild to skip calling the callback when the path doesn't match its filter, which is done for performance. Calling from esbuild's highly-parallel internals into single-threaded JavaScript code is expensive and should be avoided whenever possible for maximum speed.

You should try to use the filter regular expression instead of using JavaScript code for filtering whenever you can. This is faster because the regular expression is evaluated inside of esbuild without calling out to JavaScript at all. For example, the sample [HTTP plugin](./plugins/#http-plugin) below uses a filter of `^https?://` to ensure that the performance overhead of running the plugin is only incurred for paths that start with `http://` or `https://`.

The allowed regular expression syntax is the syntax supported by Go's [regular expression engine](https://pkg.go.dev/regexp/). This is slightly different than JavaScript. Specifically, look-ahead, look-behind, and backreferences are not supported. Go's regular expression engine is designed to avoid the catastrophic exponential-time worst case performance issues that can affect JavaScript regular expressions.

Note that namespaces can also be used for filtering. Callbacks must provide a filter regular expression but can optionally also provide a namespace to further restrict what paths are matched. This can be useful for "remembering" where a virtual module came from. Keep in mind that namespaces are matched using an exact string equality test instead of a regular expression, so unlike module paths they are not intended for storing arbitrary data.

## On-resolve callbacks

A callback added using `onResolve` will be run on each import path in each module that esbuild builds. The callback can customize how esbuild does path resolution. For example, it can intercept import paths and redirect them somewhere else. It can also mark paths as external. Here is an example:

::: code-group

```js [JS]
import * as esbuild from 'esbuild'
import path from 'node:path'

let exampleOnResolvePlugin = {
  name: 'example',
  setup(build) {
    // Redirect all paths starting with "images/" to "./public/images/"
    build.onResolve({ filter: /^images\// }, args => {
      return { path: path.join(args.resolveDir, 'public', args.path) }
    })

    // Mark all paths starting with "http://" or "https://" as external
    build.onResolve({ filter: /^https?:\/\// }, args => {
      return { path: args.path, external: true }
    })
  },
}

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  outfile: 'out.js',
  plugins: [exampleOnResolvePlugin],
  loader: { '.png': 'binary' },
})
```

```go [Go]
package main

import "os"
import "path/filepath"
import "github.com/evanw/esbuild/pkg/api"

var exampleOnResolvePlugin = api.Plugin{
  Name: "example",
  Setup: func(build api.PluginBuild) {
    // Redirect all paths starting with "images/" to "./public/images/"
    build.OnResolve(api.OnResolveOptions{Filter: `^images/`},
      func(args api.OnResolveArgs) (api.OnResolveResult, error) {
        return api.OnResolveResult{
          Path: filepath.Join(args.ResolveDir, "public", args.Path),
        }, nil
      })

    // Mark all paths starting with "http://" or "https://" as external
    build.OnResolve(api.OnResolveOptions{Filter: `^https?://`},
      func(args api.OnResolveArgs) (api.OnResolveResult, error) {
        return api.OnResolveResult{
          Path:     args.Path,
          External: true,
        }, nil
      })
  },
}

func main() {
  result := api.Build(api.BuildOptions{
    EntryPoints: []string{"app.js"},
    Bundle:      true,
    Outfile:     "out.js",
    Plugins:     []api.Plugin{exampleOnResolvePlugin},
    Write:       true,
    Loader: map[string]api.Loader{
      ".png": api.LoaderBinary,
    },
  })

  if len(result.Errors) > 0 {
    os.Exit(1)
  }
}
```

:::

The callback can return without providing a path to pass on responsibility for path resolution to the next callback. For a given import path, all `onResolve` callbacks from all plugins will be run in the order they were registered until one takes responsibility for path resolution. If no callback returns a path, esbuild will run its default path resolution logic.

Keep in mind that many callbacks may be running concurrently. In JavaScript, if your callback does expensive work that can run on another thread such as `fs.existsSync()`, you should make the callback `async` and use `await` (in this case with `fs.promises.exists()`) to allow other code to run in the meantime. In Go, each callback may be run on a separate goroutine. Make sure you have appropriate synchronization in place if your plugin uses any shared data structures.

### On-resolve options

The `onResolve` API is meant to be called within the `setup` function and registers a callback to be triggered in certain situations. It takes a few options:

::: code-group

```js [JS]
interface OnResolveOptions {
  filter: RegExp;
  namespace?: string;
}
```

```go [Go]
type OnResolveOptions struct {
  Filter    string
  Namespace string
}
```

:::

- `filter`

  Every callback must provide a filter, which is a regular expression. The registered callback will be skipped when the path doesn't match this filter. You can read more about filters [here](./plugins/#filters).

- `namespace`

  This is optional. If provided, the callback is only run on paths within modules in the provided namespace. You can read more about namespaces [here](./plugins/#namespaces).

### On-resolve arguments

When esbuild calls the callback registered by `onResolve`, it will provide these arguments with information about the imported path:

::: code-group

```js [JS]
interface OnResolveArgs {
  path: string;
  importer: string;
  namespace: string;
  resolveDir: string;
  kind: ResolveKind;
  pluginData: any;
}

type ResolveKind =
  | 'entry-point'
  | 'import-statement'
  | 'require-call'
  | 'dynamic-import'
  | 'require-resolve'
  | 'import-rule'
  | 'url-token'
```

```go [Go]
type OnResolveArgs struct {
  Path       string
  Importer   string
  Namespace  string
  ResolveDir string
  Kind       ResolveKind
  PluginData interface{}
}

const (
  ResolveEntryPoint        ResolveKind
  ResolveJSImportStatement ResolveKind
  ResolveJSRequireCall     ResolveKind
  ResolveJSDynamicImport   ResolveKind
  ResolveJSRequireResolve  ResolveKind
  ResolveCSSImportRule     ResolveKind
  ResolveCSSURLToken       ResolveKind
)
```

:::

- `path`

  This is the verbatim unresolved path from the underlying module's source code. It can take any form. While esbuild's default behavior is to interpret import paths as either a relative path or a package name, plugins can be used to introduce new path forms. For example, the sample [HTTP plugin](./plugins/#http-plugin) below gives special meaning to paths starting with `http://`.

- `importer`

This is the path of the module containing this import to be resolved. Note that this path is only guaranteed to be a file system path if the namespace is `file`. If you want to resolve a path relative to the directory containing the importer module, you should use `resolveDir` instead since that also works for virtual modules.

- `namespace`

This is the namespace of the module containing this import to be resolved, as set by the [on-load callback](./plugins/#on-load) that loaded this file. This defaults to the `file` namespace for modules loaded with esbuild's default behavior. You can read more about namespaces [here](./plugins/#namespaces).

- `resolveDir`

This is the file system directory to use when resolving an import path to a real path on the file system. For modules in the `file` namespace, this value defaults to the directory part of the module path. For virtual modules this value defaults to empty but [on-load callbacks](./plugins/#on-load) can optionally give virtual modules a resolve directory too. If that happens, it will be provided to resolve callbacks for unresolved paths in that file.

- `kind`

This says how the path to be resolved is being imported. For example, `'entry-point'` means the path was provided to the API as an entry point path, `'import-statement'` means the path is from a JavaScript `import` or `export` statement, and `'import-rule'` means the path is from a CSS `@import` rule.

- `pluginData`

This property is passed from the previous plugin, as set by the [on-load callback](./plugins/#on-load) that loaded this file.

### On-resolve results

This is the object that can be returned by a callback added using `onResolve` to provide a custom path resolution. If you would like to return from the callback without providing a path, just return the default value (so `undefined` in JavaScript and `OnResolveResult{}` in Go). Here are the optional properties that can be returned:

::: code-group

```js [JS]
interface OnResolveResult {
  errors?: Message[];
  external?: boolean;
  namespace?: string;
  path?: string;
  pluginData?: any;
  pluginName?: string;
  sideEffects?: boolean;
  suffix?: string;
  warnings?: Message[];
  watchDirs?: string[];
  watchFiles?: string[];
}

interface Message {
  text: string;
  location: Location | null;
  detail: any; // The original error from a JavaScript plugin, if applicable
}

interface Location {
  file: string;
  namespace: string;
  line: number; // 1-based
  column: number; // 0-based, in bytes
  length: number; // in bytes
  lineText: string;
}
```

```go [Go]
type OnResolveResult struct {
  Errors      []Message
  External    bool
  Namespace   string
  Path        string
  PluginData  interface{}
  PluginName  string
  SideEffects SideEffects
  Suffix      string
  Warnings    []Message
  WatchDirs   []string
  WatchFiles  []string
}

type Message struct {
  Text     string
  Location *Location
  Detail   interface{} // The original error from a Go plugin, if applicable
}

type Location struct {
  File      string
  Namespace string
  Line      int // 1-based
  Column    int // 0-based, in bytes
  Length    int // in bytes
  LineText  string
}
```

:::

- `path`

  Set this to a non-empty string to resolve the import to a specific path. If this is set, no more on-resolve callbacks will be run for this import path in this module. If this is not set, esbuild will continue to run on-resolve callbacks that were registered after the current one. Then, if the path still isn't resolved, esbuild will default to resolving the path relative to the resolve directory of the current module.

- `external`

  Set this to `true` to mark the module as [external](./api/#external), which means it will not be included in the bundle and will instead be imported at run-time.

- `namespace`

  This is the namespace associated with the resolved path. If left empty, it will default to the `file` namespace for non-external paths. Paths in the file namespace must be an absolute path for the current file system (so starting with a forward slash on Unix and with a drive letter on Windows).

  If you want to resolve to a path that isn't a file system path, you should set the namespace to something other than `file` or an empty string. This tells esbuild to not treat the path as pointing to something on the file system.

- `errors` and `warnings`

  These properties let you pass any log messages generated during path resolution to esbuild where they will be displayed in the terminal according to the current log level and end up in the final build result. For example, if you are calling a library and that library can return errors and/or warnings, you will want to forward them using these properties.

  If you only have a single error to return, you don't have to pass it via `errors`. You can simply throw the error in JavaScript or return the `error` object as the second return value in Go.

- `watchFiles` and `watchDirs`

  These properties let you return additional file system paths for esbuild's [watch mode](./api/#watch) to scan. By default esbuild will only scan the path provided to `onLoad` plugins, and only if the namespace is file. If your plugin needs to react to additional changes in the file system, it needs to use one of these properties.

  A rebuild will be triggered if any file in the `watchFiles` array has been changed since the last build. Change detection is somewhat complicated and may check the file contents and/or the file's metadata.

  A rebuild will also be triggered if the list of directory entries for any directory in the `watchDirs` array has been changed since the last build. Note that this does not check anything about the contents of any file in these directories, and it also does not check any subdirectories. Think of this as checking the output of the Unix `ls` command.

  For robustness, you should include all file system paths that were used during the evaluation of the plugin. For example, if your plugin does something equivalent to `require.resolve()`, you'll need to include the paths of all "does this file exist" checks, not just the final path. Otherwise a new file could be created that causes the build to become outdated, but esbuild doesn't detect it because that path wasn't listed.

- `pluginName`

  This property lets you replace this plugin's name with another name for this path resolution operation. It's useful for proxying another plugin through this plugin. For example, it lets you have a single plugin that forwards to a child process containing multiple plugins. You probably won't need to use this.

- `pluginData`

  This property will be passed to the next plugin that runs in the plugin chain. If you return it from an `onLoad` plugin, it will be passed to the `onResolve` plugins for any imports in that file, and if you return it from an `onResolve` plugin, an arbitrary one will be passed to the `onLoad` plugin when it loads the file (it's arbitrary since the relationship is many-to-one). This is useful to pass data between different plugins without them having to coordinate directly.

- `sideEffects`

  Setting this property to false tells esbuild that imports of this module can be removed if the imported names are unused. This behaves as if `"sideEffects": false` was specified the corresponding `package.json` file. For example, `import { x } from "y"` may be completely removed if `x` is unused and `y` has been marked as `sideEffects: false`. You can read more about what `sideEffects` means in [Webpack's documentation about the feature](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free).

- `suffix`

  Returning a value here lets you pass along an optional URL query or hash to append to the path that is not included in the path itself. Storing this separately is beneficial in cases when the path is processed by something that is not aware of the suffix, either by esbuild itself or by another plugin.

  For example, an on-resolve plugin might return a suffix of `?#iefix` for a `.eot` file in a build with a different on-load plugin for paths ending in `.eot`. Keeping the suffix separate means the suffix is still associated with the path but the `.eot` plugin will still match the file without needing to know anything about suffixes.

  If you do set a suffix, it must begin with either `?` or `#` because it's intended to be a URL query or hash. This feature has certain obscure uses such as hacking around bugs in IE8's CSS parser and may not be that useful otherwise. If you do use it, keep in mind that each unique namespace, path, and suffix combination is considered by esbuild to be a unique module identifier so by returning a different suffix for the same path, you are telling esbuild to create another copy of the module.
