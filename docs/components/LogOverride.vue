<template>

<ul>
  <li>
    <b>JS:</b>
    <ul>
      <li><details><summary><code>assign-to-constant</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">This assignment will throw because "foo" is a constant</span><span> [assign-to-constant]

    example.js:1:15:
</span><span class="color-dim">      1 │ const foo = 1; </span><span class="color-green">foo</span><span class="color-dim"> = 2
        ╵                </span><span class="color-green">~~~</span><span>

  The symbol "foo" was declared a constant here:

    example.js:1:6:
</span><span class="color-dim">      1 │ const </span><span class="color-green">foo</span><span class="color-dim"> = 1; foo = 2
        ╵       </span><span class="color-green">~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>assign-to-import</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">This assignment will throw because "foo" is an import</span><span> [assign-to-import]

    example.js:1:23:
</span><span class="color-dim">      1 │ import foo from "foo"; </span><span class="color-green">foo</span><span class="color-dim"> = null
        ╵                        </span><span class="color-green">~~~</span><span>

  Imports are immutable in JavaScript. To modify the value of this import, you must export a setter
  function in the imported file (e.g. "setFoo") and then import and call that function here instead.</span></pre>
      </details></li>
      <li><details><summary><code>call-import-namespace</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Calling "foo" will crash at run-time because it's an import namespace object, not a function</span><span> [call-import-namespace]

    example.js:1:28:
</span><span class="color-dim">      1 │ import * as foo from "foo"; </span><span class="color-green">foo</span><span class="color-dim">()
        ╵                             </span><span class="color-green">~~~</span><span>

  Consider changing "foo" to a default import instead:

    example.js:1:7:
</span><span class="color-dim">      1 │ import </span><span class="color-green">* as foo</span><span class="color-dim"> from "foo"; foo()
        │        </span><span class="color-green">~~~~~~~~</span><span class="color-dim">
        ╵        </span><span class="color-green">foo</span><span></span></pre>
      </details></li>
      <li><details><summary><code>commonjs-variable-in-esm</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">The CommonJS "exports" variable is treated as a global variable in an ECMAScript module and may not work as expected</span><span> [commonjs-variable-in-esm]

    example.js:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">exports</span><span class="color-dim">.foo = 1; export let bar = 2
        ╵ </span><span class="color-green">~~~~~~~</span><span>

  This file is considered to be an ECMAScript module because of the "export" keyword here:

    example.js:1:17:
</span><span class="color-dim">      1 │ exports.foo = 1; </span><span class="color-green">export</span><span class="color-dim"> let bar = 2
        ╵                  </span><span class="color-green">~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>delete-super-property</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Attempting to delete a property of "super" will throw a ReferenceError</span><span> [delete-super-property]

    example.js:1:42:
</span><span class="color-dim">      1 │ class Foo extends Object { foo() { delete </span><span class="color-green">super</span><span class="color-dim">.foo } }
        ╵                                           </span><span class="color-green">~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>duplicate-case</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">This case clause will never be evaluated because it duplicates an earlier case clause</span><span> [duplicate-case]

    example.js:1:33:
</span><span class="color-dim">      1 │ switch (foo) { case 1: return 1; </span><span class="color-green">case</span><span class="color-dim"> 1: return 2 }
        ╵                                  </span><span class="color-green">~~~~</span><span>

  The earlier case clause is here:

    example.js:1:15:
</span><span class="color-dim">      1 │ switch (foo) { </span><span class="color-green">case</span><span class="color-dim"> 1: return 1; case 1: return 2 }
        ╵                </span><span class="color-green">~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>duplicate-object-key</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Duplicate key "bar" in object literal</span><span> [duplicate-object-key]

    example.js:1:16:
</span><span class="color-dim">      1 │ foo = { bar: 1, </span><span class="color-green">bar</span><span class="color-dim">: 2 }
        ╵                 </span><span class="color-green">~~~</span><span>

  The original key "bar" is here:

    example.js:1:8:
</span><span class="color-dim">      1 │ foo = { </span><span class="color-green">bar</span><span class="color-dim">: 1, bar: 2 }
        ╵         </span><span class="color-green">~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>empty-import-meta</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"import.meta" is not available in the configured target environment ("chrome50") and will be empty</span><span> [empty-import-meta]

    example.js:1:6:
</span><span class="color-dim">      1 │ foo = </span><span class="color-green">import.meta</span><span class="color-dim">
        ╵       </span><span class="color-green">~~~~~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>equals-nan</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Comparison with NaN using the "!==" operator here is always true</span><span> [equals-nan]

    example.js:1:24:
</span><span class="color-dim">      1 │ foo = foo.filter(x =&gt; x </span><span class="color-green">!==</span><span class="color-dim"> NaN)
        ╵                         </span><span class="color-green">~~~</span><span>

  Floating-point equality is defined such that NaN is never equal to anything, so "x === NaN" always
  returns false. You need to use "Number.isNaN(x)" instead to test for NaN.</span></pre>
      </details></li>
      <li><details><summary><code>equals-negative-zero</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Comparison with -0 using the "!==" operator will also match 0</span><span> [equals-negative-zero]

    example.js:1:28:
</span><span class="color-dim">      1 │ foo = foo.filter(x =&gt; x !== </span><span class="color-green">-0</span><span class="color-dim">)
        ╵                             </span><span class="color-green">~~</span><span>

  Floating-point equality is defined such that 0 and -0 are equal, so "x === -0" returns true for
  both 0 and -0. You need to use "Object.is(x, -0)" instead to test for -0.</span></pre>
      </details></li>
      <li><details><summary><code>equals-new-object</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Comparison using the "!==" operator here is always true</span><span> [equals-new-object]

    example.js:1:24:
</span><span class="color-dim">      1 │ foo = foo.filter(x =&gt; x </span><span class="color-green">!==</span><span class="color-dim"> [])
        ╵                         </span><span class="color-green">~~~</span><span>

  Equality with a new object is always false in JavaScript because the equality operator tests
  object identity. You need to write code to compare the contents of the object instead. For
  example, use "Array.isArray(x) &amp;&amp; x.length === 0" instead of "x === []" to test for an empty
  array.</span></pre>
      </details></li>
      <li><details><summary><code>html-comment-in-js</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Treating "&lt;!--" as the start of a legacy HTML single-line comment</span><span> [html-comment-in-js]

    example.js:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">&lt;!--</span><span class="color-dim"> comment --&gt;
        ╵ </span><span class="color-green">~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>impossible-typeof</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">The "typeof" operator will never evaluate to "null"</span><span> [impossible-typeof]

    example.js:1:32:
</span><span class="color-dim">      1 │ foo = foo.map(x =&gt; typeof x !== </span><span class="color-green">"null"</span><span class="color-dim">)
        ╵                                 </span><span class="color-green">~~~~~~</span><span>

  The expression "typeof x" actually evaluates to "object" in JavaScript, not "null". You need to
  use "x === null" to test for null.</span></pre>
      </details></li>
      <li><details><summary><code>indirect-require</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Indirect calls to "require" will not be bundled</span><span> [indirect-require]

    example.js:1:8:
</span><span class="color-dim">      1 │ let r = </span><span class="color-green">require</span><span class="color-dim">, fs = r("fs")
        ╵         </span><span class="color-green">~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>private-name-will-throw</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Writing to getter-only property "#foo" will throw</span><span> [private-name-will-throw]

    example.js:1:39:
</span><span class="color-dim">      1 │ class Foo { get #foo() {} bar() { this.</span><span class="color-green">#foo</span><span class="color-dim">++ } }
        ╵                                        </span><span class="color-green">~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>semicolon-after-return</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">The following expression is not returned because of an automatically-inserted semicolon</span><span> [semicolon-after-return]

    example.js:1:6:
</span><span class="color-dim">      1 │ return</span><span class="color-green"></span><span class="color-dim">
        ╵       </span><span class="color-green">^</span><span></span></pre>
      </details></li>
      <li><details><summary><code>suspicious-boolean-not</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Suspicious use of the "!" operator inside the "in" operator</span><span> [suspicious-boolean-not]

    example.js:1:4:
</span><span class="color-dim">      1 │ if (</span><span class="color-green">!foo</span><span class="color-dim"> in bar) {
        │     </span><span class="color-green">~~~~</span><span class="color-dim">
        ╵     </span><span class="color-green">(!foo)</span><span>

  The code "!x in y" is parsed as "(!x) in y". You need to insert parentheses to get "!(x in y)"
  instead.</span></pre>
      </details></li>
      <li><details><summary><code>this-is-undefined-in-esm</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Top-level "this" will be replaced with undefined since this file is an ECMAScript module</span><span> [this-is-undefined-in-esm]

    example.js:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">this</span><span class="color-dim">.foo = 1; export let bar = 2
        │ </span><span class="color-green">~~~~</span><span class="color-dim">
        ╵ </span><span class="color-green">undefined</span><span>

  This file is considered to be an ECMAScript module because of the "export" keyword here:

    example.js:1:14:
</span><span class="color-dim">      1 │ this.foo = 1; </span><span class="color-green">export</span><span class="color-dim"> let bar = 2
        ╵               </span><span class="color-green">~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-dynamic-import</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">This "import" expression will not be bundled because the argument is not a string literal</span><span> [unsupported-dynamic-import]

    example.js:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">import</span><span class="color-dim">(foo)
        ╵ </span><span class="color-green">~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-jsx-comment</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Invalid JSX factory: 123</span><span> [unsupported-jsx-comment]

    example.jsx:1:8:
</span><span class="color-dim">      1 │ // @jsx </span><span class="color-green">123</span><span class="color-dim">
        ╵         </span><span class="color-green">~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-regexp</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">The regular expression flag "d" is not available in the configured target environment ("chrome50")</span><span> [unsupported-regexp]

    example.js:1:3:
</span><span class="color-dim">      1 │ /./</span><span class="color-green">d</span><span class="color-dim">
        ╵    </span><span class="color-green">^</span><span>

  This regular expression literal has been converted to a "new RegExp()" constructor to avoid
  generating code with a syntax error. However, you will need to include a polyfill for "RegExp" for
  your code to have the correct behavior at run-time.</span></pre>
      </details></li>
      <li><details><summary><code>unsupported-require-call</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">This call to "require" will not be bundled because the argument is not a string literal</span><span> [unsupported-require-call]

    example.js:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">require</span><span class="color-dim">(foo)
        ╵ </span><span class="color-green">~~~~~~~</span><span></span></pre>
      </details></li>
    </ul>
    <br>
  </li>

  <li>
    <b>CSS:</b>
    <ul>
      <li><details><summary><code>css-syntax-error</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Expected identifier but found "]"</span><span> [css-syntax-error]

    example.css:1:4:
</span><span class="color-dim">      1 │ div[</span><span class="color-green">]</span><span class="color-dim"> {
        ╵     </span><span class="color-green">^</span><span></span></pre>
      </details></li>
      <li><details><summary><code>invalid-@charset</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"@charset" must be the first rule in the file</span><span> [invalid-@charset]

    example.css:1:19:
</span><span class="color-dim">      1 │ div { color: red } </span><span class="color-green">@charset</span><span class="color-dim"> "UTF-8";
        ╵                    </span><span class="color-green">~~~~~~~~</span><span>

  This rule cannot come before a "@charset" rule

    example.css:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green"></span><span class="color-dim">div { color: red } @charset "UTF-8";
        ╵ </span><span class="color-green">^</span><span></span></pre>
      </details></li>
      <li><details><summary><code>invalid-@import</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">All "@import" rules must come first</span><span> [invalid-@import]

    example.css:1:19:
</span><span class="color-dim">      1 │ div { color: red } </span><span class="color-green">@import</span><span class="color-dim"> "foo.css";
        ╵                    </span><span class="color-green">~~~~~~~</span><span>

  This rule cannot come before an "@import" rule

    example.css:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green"></span><span class="color-dim">div { color: red } @import "foo.css";
        ╵ </span><span class="color-green">^</span><span></span></pre>
      </details></li>
      <li><details><summary><code>invalid-@layer</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"initial" cannot be used as a layer name</span><span> [invalid-@layer]

    example.css:1:7:
</span><span class="color-dim">      1 │ @layer </span><span class="color-green">initial</span><span class="color-dim"> {
        ╵        </span><span class="color-green">~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>invalid-calc</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"-" can only be used as an infix operator, not a prefix operator</span><span> [invalid-calc]

    example.css:1:20:
</span><span class="color-dim">      1 │ div { z-index: calc(</span><span class="color-green">-</span><span class="color-dim">(1+2)); }
        ╵                     </span><span class="color-green">^</span><span>

</span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">The "+" operator only works if there is whitespace on both sides</span><span> [invalid-calc]

    example.css:1:23:
</span><span class="color-dim">      1 │ div { z-index: calc(-(1</span><span class="color-green">+</span><span class="color-dim">2)); }
        ╵                        </span><span class="color-green">^</span><span></span></pre>
      </details></li>
      <li><details><summary><code>js-comment-in-css</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Comments in CSS use "/* ... */" instead of "//"</span><span> [js-comment-in-css]

    example.css:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">//</span><span class="color-dim"> comment
        ╵ </span><span class="color-green">~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-@charset</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"UTF-8" will be used instead of unsupported charset "ASCII"</span><span> [unsupported-@charset]

    example.css:1:9:
</span><span class="color-dim">      1 │ @charset </span><span class="color-green">"ASCII"</span><span class="color-dim">;
        ╵          </span><span class="color-green">~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-@namespace</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"@namespace" rules are not supported</span><span> [unsupported-@namespace]

    example.css:1:0:
</span><span class="color-dim">      1 │ </span><span class="color-green">@namespace</span><span class="color-dim"> "ns";
        ╵ </span><span class="color-green">~~~~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-css-property</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"widht" is not a known CSS property</span><span> [unsupported-css-property]

    example.css:1:6:
</span><span class="color-dim">      1 │ div { </span><span class="color-green">widht</span><span class="color-dim">: 1px }
        │       </span><span class="color-green">~~~~~</span><span class="color-dim">
        ╵       </span><span class="color-green">width</span><span>

  Did you mean "width" instead?</span></pre>
      </details></li>
      <li><details><summary><code>unsupported-css-nesting</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">CSS nesting syntax is not supported in the configured target environment ("chrome50")</span><span> [unsupported-css-nesting]

    example.css:2:0:
</span><span class="color-dim">      2 │ </span><span class="color-green">&amp;</span><span class="color-dim">:hover {
        ╵ </span><span class="color-green">^</span><span></span></pre>
      </details></li>
    </ul>
    <br>
  </li>

  <li>
    <b>Bundler:</b>
    <ul>
      <li><details><summary><code>ambiguous-reexport</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Re-export of "foo" in "example.js" is ambiguous and has been removed</span><span> [ambiguous-reexport]

  One definition of "foo" comes from "a.js" here:

    a.js:1:11:
</span><span class="color-dim">      1 │ export let </span><span class="color-green">foo</span><span class="color-dim"> = 1
        ╵            </span><span class="color-green">~~~</span><span>

  Another definition of "foo" comes from "b.js" here:

    b.js:1:11:
</span><span class="color-dim">      1 │ export let </span><span class="color-green">foo</span><span class="color-dim"> = 2
        ╵            </span><span class="color-green">~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>different-path-case</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Use "foo.js" instead of "Foo.js" to avoid issues with case-sensitive file systems</span><span> [different-path-case]

    example.js:2:7:
</span><span class="color-dim">      2 │ import </span><span class="color-green">"./Foo.js"</span><span class="color-dim">
        ╵        </span><span class="color-green">~~~~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>ignored-bare-import</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Ignoring this import because "node_modules/foo/index.js" was marked as having no side effects</span><span> [ignored-bare-import]

    example.js:1:7:
</span><span class="color-dim">      1 │ import </span><span class="color-green">"foo"</span><span class="color-dim">
        ╵        </span><span class="color-green">~~~~~</span><span>

  "sideEffects" is false in the enclosing "package.json" file:

    node_modules/foo/package.json:2:2:
</span><span class="color-dim">      2 │   </span><span class="color-green">"sideEffects"</span><span class="color-dim">: false
        ╵   </span><span class="color-green">~~~~~~~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>ignored-dynamic-import</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Importing "foo" was allowed even though it could not be resolved because dynamic import failures appear to be handled here:</span><span> [ignored-dynamic-import]

    example.js:1:7:
</span><span class="color-dim">      1 │ import(</span><span class="color-green">"foo"</span><span class="color-dim">).catch(e =&gt; {
        ╵        </span><span class="color-green">~~~~~</span><span>

  The handler for dynamic import failures is here:

    example.js:1:14:
</span><span class="color-dim">      1 │ import("foo").</span><span class="color-green">catch</span><span class="color-dim">(e =&gt; {
        ╵               </span><span class="color-green">~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>import-is-undefined</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Import "foo" will always be undefined because the file "foo.js" has no exports</span><span> [import-is-undefined]

    example.js:1:9:
</span><span class="color-dim">      1 │ import { </span><span class="color-green">foo</span><span class="color-dim"> } from "./foo"
        ╵          </span><span class="color-green">~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>require-resolve-not-external</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"foo" should be marked as external for use with "require.resolve"</span><span> [require-resolve-not-external]

    example.js:1:26:
</span><span class="color-dim">      1 │ let foo = require.resolve(</span><span class="color-green">"foo"</span><span class="color-dim">)
        ╵                           </span><span class="color-green">~~~~~</span><span></span></pre>
      </details></li>
    </ul>
    <br>
  </li>

  <li>
    <b>Source maps:</b>
    <ul>
      <li><details><summary><code>invalid-source-mappings</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Bad "mappings" data in source map at character 3: Invalid original column value: -2</span><span> [invalid-source-mappings]

    example.js.map:2:18:
</span><span class="color-dim">      2 │   "mappings": "aAA</span><span class="color-green">F</span><span class="color-dim">A,UAAU;;"
        ╵                   </span><span class="color-green">^</span><span>

  The source map "example.js.map" was referenced by the file "example.js" here:

    example.js:1:21:
</span><span class="color-dim">      1 │ //# sourceMappingURL=</span><span class="color-green">example.js.map</span><span class="color-dim">
        ╵                      </span><span class="color-green">~~~~~~~~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>sections-in-source-map</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Source maps with "sections" are not supported</span><span> [sections-in-source-map]

    example.js.map:2:2:
</span><span class="color-dim">      2 │   </span><span class="color-green">"sections"</span><span class="color-dim">: []
        ╵   </span><span class="color-green">~~~~~~~~~~</span><span>

  The source map "example.js.map" was referenced by the file "example.js" here:

    example.js:1:21:
</span><span class="color-dim">      1 │ //# sourceMappingURL=</span><span class="color-green">example.js.map</span><span class="color-dim">
        ╵                      </span><span class="color-green">~~~~~~~~~~~~~~</span><span></span></pre>
      </details></li>
      <li><details><summary><code>missing-source-map</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Cannot read file ".": is a directory</span><span> [missing-source-map]

    example.js:1:21:
</span><span class="color-dim">      1 │ //# sourceMappingURL=</span><span class="color-green">.</span><span class="color-dim">
        ╵                      </span><span class="color-green">^</span><span></span></pre>
      </details></li>
      <li><details><summary><code>unsupported-source-map-comment</code></summary>
      <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Unsupported source map comment: could not decode percent-escaped data: invalid URL escape "%\""</span><span> [unsupported-source-map-comment]

    example.js:1:21:
</span><span class="color-dim">      1 │ //# sourceMappingURL=</span><span class="color-green">data:application/json,"%"</span><span class="color-dim">
        ╵                      </span><span class="color-green">~~~~~~~~~~~~~~~~~~~~~~~~~</span><span></span></pre>
      </details></li>
    </ul>
    <br>
  </li>

  <li>
    <b>Resolver:</b>
    <ul>
      <li>
        <details>
          <summary><code>package.json</code></summary>
          <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">"esm" is not a valid value for the "type" field</span><span> [package.json]

    package.json:1:10:
</span><span class="color-dim">      1 │ { "type": </span><span class="color-green">"esm"</span><span class="color-dim"> }
        ╵           </span><span class="color-green">~~~~~</span><span>

  The "type" field must be set to either "commonjs" or "module".</span></pre>
          </details>
      </li>
      <li>
        <details>
          <summary><code>tsconfig.json</code></summary>
          <pre><span></span><span class="color-yellow">▲ </span><span class="bg-yellow color-yellow">[</span><span class="bg-yellow color-black">WARNING</span><span class="bg-yellow color-yellow">]</span><span> </span><span class="color-bold">Unrecognized target environment "ES4"</span><span> [tsconfig.json]

    tsconfig.json:1:33:
</span><span class="color-dim">      1 │ { "compilerOptions": { "target": </span><span class="color-green">"ES4"</span><span class="color-dim"> } }
        ╵                                  </span><span class="color-green">~~~~~</span><span></span></pre>
        </details>
      </li>
    </ul>
    <br>
  </li>
</ul>

</template>

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
