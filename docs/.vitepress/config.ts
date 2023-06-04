import { defineConfig } from 'vitepress'
import { default as replPlugin } from 'vitepress-markdown-it-repl'
import { default as sup_plugin } from 'markdown-it-sup'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  ignoreDeadLinks: true,
  lastUpdated: true,
  cleanUrls: true,
  head: [
    [
      'link', { href: '/favicon.svg', type: 'image/svg+xml' }
    ]
  ],
  locales: {
    root: {
      title: "esbuild tutorial",
      description: "esbuild tutorial from beginner to master",
      label: 'English',
      lang: 'en',
      themeConfig: {
        // i18nRouting: true,
        logo: '/favicon.svg',
        outline: [1, 3],
        editLink: {
          pattern: 'https://github.com/itcatplayit/esbuild-tutorial/edit/main/docs/:path',
          // text: '在 GitHub 上编辑此页面',
        },
        nav: [
          { text: 'Api', link: '/official/api' }
        ],
        sidebar: [
          { text: 'Getting Started', link: '/official/getting-started', activeMatch: '/official/', },
          { text: 'API', link: '/official/api', activeMatch: '/official/', },
          { text: 'content Types', link: '/official/content-types', activeMatch: '/official/', },
          { text: 'FAQ', link: '/official/faq', activeMatch: '/official/', },
          { text: 'Bundle Size Analyzer', link: 'https://esbuild.github.io/analyze/' }
        ],
    
        socialLinks: [
          { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
        ],
        // carbonAds: {
        // 	code: 'your-carbon-code',
        // 	placement: 'your-carbon-placement',
        // },
        // docFooter: {
        // 	prev: 'Pagina prior',
        // 	next: 'Proxima pagina',
        // },
        footer: {
          message: 'Released under the <a href="https://github.com/itcatplayit/esbuild-tutorial/blob/main/LICENSE">MIT License</a>.',
          copyright: 'Copyright © 2022-present <a href="https://github.com/itcatplayit">itcatplayit</a>',
        },
        // darkModeSwitchLabel: 'Appearance',
        // sidebarMenuLabel: 'Menu',
        // returnToTopLabel: 'Return to top',
        // langMenuLabel: 'Change language',
      }
    },
    zh_cn: {
      title: "esbuild教程",
      description: "esbuild教程从0到1",
      label: '中文简体',
      lang: 'zh-CN',
      link: '/zh_cn/',
      themeConfig: {
        // i18nRouting: true,
        logo: '/favicon.svg',
        search: {
          provider: 'local',
          options: {
            locales: {
              zh: {
                translations: {
                  button: {
                    buttonText: '搜索文档',
                    buttonAriaLabel: '搜索文档',
                  },
                  modal: {
                    noResultsText: '无法找到相关结果',
                    resetButtonTitle: '清除查询条件',
                    footer: {
                      selectText: '选择',
                      navigateText: '切换',
                    },
                  },
                },
              },
            },
          },
        },
        nav: [
          { text: 'Api', link: '/zh_cn/official/api' }
        ],
        outline: [1, 3],
        outlineTitle: '页面导航',
        lastUpdatedText: '最后更新于',
        editLink: {
          pattern: 'https://github.com/itcatplayit/esbuild-tutorial/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页面',
        },
        sidebar: [
          { text: 'Getting Started', link: '/zh_cn/official/getting-started', activeMatch: '/zh_cn/official/', },
          { text: 'API', link: '/zh_cn/official/api', activeMatch: '/zh_cn/official/', },
          { text: 'content Types', link: '/zh_cn/official/content-types', activeMatch: '/zh_cn/official/', },
          { text: 'FAQ', link: '/zh_cn/official/faq', activeMatch: '/zh_cn/official/', },
          { text: '包大小分析', link: 'https://esbuild.github.io/analyze/' }
        ],
        socialLinks: [
          { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
        ],
        // carbonAds: {
        // 	code: 'your-carbon-code',
        // 	placement: 'your-carbon-placement',
        // },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        },
        footer: {
          message: '<a href="https://github.com/itcatplayit/esbuild-tutorial/blob/main/LICENSE">MIT 开源协议</a>.',
          copyright: '版权 © 2022-至今 <a href="https://github.com/itcatplayit">itcatplayit</a>',
        },
        // darkModeSwitchLabel: 'Appearance',
        // sidebarMenuLabel: 'Menu',
        // returnToTopLabel: 'Return to top',
        // langMenuLabel: 'Change language',
      }
    },
  },
  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true,
    config: md => { 
      md.use(replPlugin, { globalEnabledLineNumbers: true })
      md.use(sup_plugin)
    },
  },
})
