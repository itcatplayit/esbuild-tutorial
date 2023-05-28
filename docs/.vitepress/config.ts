import { defineConfig } from 'vitepress'
import { default as replPlugin } from 'vitepress-markdown-it-repl'
import { default as sup_plugin } from 'markdown-it-sup'

export default defineConfig({
  title: "esbuild tutorial",
  description: "esbuild tutorial from beginner to master",
  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true,
    config: md => { 
      replPlugin(md, { globalEnabledLineNumbers: true })
      sup_plugin(md)
    },
  },
  themeConfig: {
    nav: [
      { text: 'Api', link: '/official/api' }
    ],

    sidebar: [
      { text: 'Getting Started', link: '/official/getting-started' },
      { text: 'API', link: '/official/api' },
      { text: 'content Types', link: '/official/content-types' },
      { text: 'FAQ', link: '/official/faq' },
      { text: 'Bundle Size Analyzer', link: 'https://esbuild.github.io/analyze/' }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
