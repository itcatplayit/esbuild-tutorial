---
layout: home

hero:
  name: "esbuild"
  tagline: "一个web端的极快打包工具"
  actions:
    - theme: brand
      text: 快速开始
      link: /zh_cn/official/getting-started
    - theme: alt
      text: API
      link: /zh_cn/official/api

features:
  - title: ''
    details: 无需缓存即可实现极高的速度
  - title: ''
    details: 内置<a href="./official/content-types/#javascript">JavaScript</a>, <a href="./official/content-types/#css">CSS</a>, <a href="./official/content-types/#typescript">TypeScript</a> 和 <a href="./official/content-types/#jsx">JSX</a>
  - title: ''
    details: 为CLI, JS, 和 Go涉及的易懂的 <a href="./official/api">API</a>
  - title: ''
    details: 可打包成ESM模块和CommonJS模块
  - title: ''
    details: 摇树, <a href="./official/api/#minify">缩小</a>, 和 <a href="./official/api/#sourcemap">源码映射</a>
  - title: ''
    details: <a href="./official/api/#serve">本地服务</a>, <a href="./official/api/#watch">监听模式</a>, 和 <a href="./official/plugins/">插件</a>
---

<script setup>
import HomeContent from '../components/HomeContent.vue'
</script>

<HomeContent lang="zh_cn" />

