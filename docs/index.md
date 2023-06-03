---
layout: home

hero:
  name: "esbuild"
  tagline: "An extremely fast bundler for the web"
  actions:
    - theme: brand
      text: Getting Started
      link: /official/getting-started
    - theme: alt
      text: API Examples
      link: /api-examples

features:
  - title: ''
    details: Extreme speed without needing a cache
  - title: ''
    details: <a href="./official/content-types/#javascript">JavaScript</a>, <a href="./official/content-types/#css">CSS</a>, <a href="./official/content-types/#typescript">TypeScript</a> and <a href="./official/content-types/#jsx">JSX</a> built-in
  - title: ''
    details: A straightforward <a href="./official/api">API</a> for CLI, JS, and Go
  - title: ''
    details: Bundles ESM and CommonJS modules
  - title: ''
    details: Tree shaking, <a href="./official/api/#minify">minification</a>, and <a href="./official/api/#sourcemap">source maps</a>
  - title: ''
    details: <a href="./official/api/#serve">Local server</a>, <a href="./official/api/#watch">watch mode</a>, and <a href="./official/plugins/">plugins</a>
---

<script setup>
import HomeContent from './components/HomeContent.vue'
</script>

<HomeContent />
