<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  const props = defineProps<{
    lang?: string
  }>()

  const progress = ref(null)
  let n = null
  let t = null
  const a = function() {
    if (!progress.value) return
    t || (t = progress.value.getAnimations()[0]),
    t && (progress.value.textContent = Math.floor(t.timeline.currentTime / 1e3) + "s",
    t.playState === "finished" && (clearInterval(n),
    progress.value.style.display = "none"))
  }

  onMounted(() => {
    progress.value.getAnimations && (n = setInterval(a, 250), a())
  })
</script>

<template>
<div style="padding:10px 76.5px;">
  <figure class="bench" style="position:relative;max-width:800px;height:110px;font-size:13px;line-height:20px;">
    <div style="position:absolute;left:90px;top:0;right:0;height:80px;">
      <div style="position:absolute;left:0.00%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
      <div style="position:absolute;left:21.64%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
      <div style="position:absolute;left:43.28%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
      <div style="position:absolute;left:64.92%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
      <div style="position:absolute;left:86.56%;top:0;width:1px;bottom:0;background:rgba(127,127,127,0.25);"></div>
      <div style="position:absolute;left:0;top:3px;width:0.80%;height:14px;background:rgba(191,191,191,0.2);"></div>
      <div style="position:absolute;left:0;top:3px;width:0.80%;height:14px;background:#FFCF00;" class="bench0-bar0"></div>
      <div style="position:absolute;right:100%;top:0px;width:90px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;font-weight:bold;">
        <a href="https://esbuild.github.io/">esbuild</a>
      </div>
      <div style="position:absolute;left:0.80%;top:0px;height:20px;margin-left:8px;font-weight:bold;">0.37s</div>
      <div style="position:absolute;left:0;top:23px;width:66.01%;height:14px;background:rgba(191,191,191,0.2);"></div>
      <div style="position:absolute;left:0;top:23px;width:66.01%;height:14px;background:#FFCF00;" class="bench0-bar1"></div>
      <div style="position:absolute;right:100%;top:20px;width:90px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
        <a href="https://parceljs.org/">parcel 2</a>
      </div>
      <div style="position:absolute;left:66.01%;top:20px;height:20px;margin-left:8px;">30.50s</div>
      <div style="position:absolute;left:0;top:43px;width:69.40%;height:14px;background:rgba(191,191,191,0.2);"></div>
      <div style="position:absolute;left:0;top:43px;width:69.40%;height:14px;background:#FFCF00;" class="bench0-bar2"></div>
      <div style="position:absolute;right:100%;top:40px;width:90px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
        <a href="https://rollupjs.org/">rollup</a>
        + <a href="https://terser.org/">terser</a>
      </div>
      <div style="position:absolute;left:69.40%;top:40px;height:20px;margin-left:8px;">32.07s</div>
      <div style="position:absolute;left:0;top:63px;width:85.92%;height:14px;background:rgba(191,191,191,0.2);"></div>
      <div style="position:absolute;left:0;top:63px;width:85.92%;height:14px;background:#FFCF00;" class="bench0-bar3"></div>
      <div style="position:absolute;right:100%;top:60px;width:90px;height:20px;text-align:right;white-space:nowrap;margin-right:8px;">
        <a href="https://webpack.js.org/">webpack 5</a>
      </div>
      <div style="position:absolute;left:85.92%;top:60px;height:20px;margin-left:8px;">39.70s</div>
      <div style="position:absolute;left:0.00%;top:84px;width:50px;margin-left:-25px;text-align:center;">0s</div>
      <div style="position:absolute;left:21.64%;top:84px;width:50px;margin-left:-25px;text-align:center;">10s</div>
      <div style="position:absolute;left:43.28%;top:84px;width:50px;margin-left:-25px;text-align:center;">20s</div>
      <div style="position:absolute;left:64.92%;top:84px;width:50px;margin-left:-25px;text-align:center;">30s</div>
      <div style="position:absolute;left:86.56%;top:84px;width:50px;margin-left:-25px;text-align:center;">40s</div>
      <div id="bench0-progress" ref="progress" class="progress" style="position:absolute;top:84px;width:50px;margin-left:-25px;text-align:center;"></div>
    </div>
  </figure>
  <template v-if="props.lang">
    <figcaption>
      上图：使用默认设置（包括缩小和源码映射）从头开始制作10个<a href="https://github.com/mrdoob/three.js">three.js</a>库副本的生产包的时间。<a href="./official/faq/#benchmark-details">点击此处</a>了解更多信息。
    </figcaption>
    <p>
      我们目前的web构建工具比实际速度慢10-100倍。esbuild打包项目的主要目标是带来构建工具性能的新时代，并在此过程中创建一个易于使用的现代打包工具。
    </p>
  </template>
  <template v-else>
    <figcaption>
      Above: the time to do a production bundle of 10 copies of the <a href="https://github.com/mrdoob/three.js">three.js</a>
      library from scratch using default settings, including minification and source maps. More info <a href="./official/faq/#benchmark-details">here</a>
      .
    </figcaption>
    <p>
      Our current build tools for the web are 10-100x slower than they could be. The main goal of the esbuild bundler project is to bring about a new era of build tool performance, and create an easy-to-use modern bundler along the way.
    </p>
  </template>
</div>
</template>

<style>
  @keyframes bench0-anim {
    0% {
        left: 0
    }

    to {
        left: 85.915%
    }
  }
  @keyframes scale-bar {

    /* Note: This scale factor has to be non-zero to avoid a WebKit bug: https://bugs.webkit.org/show_bug.cgi?id=228896 */
    0% {
      transform: scale(0.0000001, 1);
    }

    100% {
      transform: scale(1, 1);
    }
  }

  #bench0-progress {
    animation: bench0-anim 39.7s linear;
    left: 85.915%
  }

  .bench0-bar0 {
    animation: scale-bar .37s linear;
    transform-origin: left
  }

  .bench0-bar1 {
    animation: scale-bar 30.5s linear;
    transform-origin: left
  }

  .bench0-bar2 {
    animation: scale-bar 32.07s linear;
    transform-origin: left
  }

  .bench0-bar3 {
    animation: scale-bar 39.7s linear;
    transform-origin: left
  }

  .bench {
    margin: 60px auto;
  }

  figure+figcaption {
    font-weight: 400;
    text-align: left;
    margin: -40px auto 60px;
    font-size: 13px;
    line-height: 140%;
    font-style: italic;
    max-width: 800px;
    padding: 0 15%;
    box-sizing: border-box;
  }
</style>
