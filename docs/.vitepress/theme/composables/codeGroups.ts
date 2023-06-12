import { inBrowser } from 'vitepress'
import { type Router } from 'vitepress/client'
import { onMounted, watch } from 'vue'

let prevGroupIndex = 0
let groupsDoneWork = {}

function initCodeGroup() {
  const oldLanguage = localStorage.getItem('vitepress-markdown-language')
  // set page's language
  const timer = setTimeout(() => {
    oldLanguage && Array.from(document?.querySelectorAll('.vp-code-group')).forEach((group, gidx) => {
      // ------------ language ---------------------
      const current = group ?.querySelector('.blocks div[class*="language-"].active')
      Array.from(group ?.querySelectorAll('.blocks div[class*="language-"]')).forEach((next, nidx) => {
        // language
        if (next ?.classList.contains(oldLanguage)) {
          if (current && next && current !== next) {
            current.classList.remove('active')
            next.classList.add('active')
          }
          const fel = group.querySelectorAll('input')[nidx]
          fel.click()
        }
      })
      // ------------ language ---------------------
    })
    clearTimeout(timer)
  }, 500)
}

export async function useCodeGroups(router: Router) {
  if (inBrowser) {
    watch(() => router.route.path, (to, from) => {
      prevGroupIndex = 0
      groupsDoneWork = {}
      initCodeGroup()
    })

    window.addEventListener('click', (e) => {
      const el = e.target as HTMLInputElement

      if (el.matches('.vp-code-group input')) {
        const group = el.parentElement?.parentElement
        const i = Array.from(group?.querySelectorAll('input') || []).indexOf(el)

        // tabname/filename
        const tabname = el.nextElementSibling?.textContent

        // language
        const block = group?.querySelectorAll('.blocks div[class*="language-"]')?.[i]
        const classList = Array.from(block?.classList || [])
        const language = classList.find(v => v.startsWith('language-'))

        if (language?.slice(9)) {
          localStorage.setItem('vitepress-markdown-language', language)
        }

        const allgroups = Array.from(document ?.querySelectorAll('.vp-code-group'))
        for (let gidx = prevGroupIndex, len = allgroups.length; gidx < len; gidx++) {
          if (groupsDoneWork[gidx + '']) {
            if (Object.keys(groupsDoneWork).length === len) {
              const ttimer = setTimeout(() => {
                groupsDoneWork = {}
                prevGroupIndex = 0
                clearTimeout(ttimer)
              }, 500)
            }
            return
          }
          const group = allgroups[gidx]
          const bls = Array.from(group ?.querySelectorAll('.blocks div[class*="language-"]'))
          let currentIdx = 0
          let current = null
          for (const item of bls) {
            if (item ?.classList.contains('active')) {
              current = item
              break
            }
            currentIdx++
          }
          if (!current) continue
         
          // ------------ language ---------------------
          let hasSameLaug = false
          const blds = Array.from(group ?.querySelectorAll('.blocks div[class*="language-"]'))
          for (let nidx = 0, len = blds.length; nidx < len; nidx++) {
            const next = blds[nidx]
            // language
            if (next?.classList.contains(language)) {
              if (current && next && current !== next) {
                current.classList.remove('active')
                next.classList.add('active')
              }
              const fel = group.querySelectorAll('.tabs input')[nidx]
              if (fel !== el && nidx !== currentIdx) {
                prevGroupIndex = gidx + 1
                hasSameLaug = true
                fel?.click()
                break
              }
            }
          }
          // ------------ language ---------------------
          
          // ------------ tabname/filename ---------------------
          // if (!hasSameLaug) {
          //   const oInputs = Array.from(group.querySelectorAll('.tabs input'))
          //   for (let i = 0, len = oInputs.length; i < len; i++) {
          //     const fel = oInputs[i]
          //     if (fel ?.nextElementSibling ?.textContent === tabname) {
          //       if (fel !== el && i !== currentIdx) {
          //         prevGroupIndex = gidx + 1
          //         fel?.click()
          //         break  
          //       }
          //     }
          //   }
          // }
          // ------------ tabname/filename ---------------------
          groupsDoneWork[gidx + ''] = true
        }

      }
    })
  }
}
