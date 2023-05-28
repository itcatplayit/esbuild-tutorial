import { inBrowser } from 'vitepress'
import { onMounted } from 'vue'

export async function useCodeGroups() {
  if (inBrowser) {
    const oldLanguage = sessionStorage.getItem('vitepress-markdown-language')

    // set page's language
    const timer = setTimeout(() => {
      oldLanguage && Array.from(document?.querySelectorAll('.vp-code-group')).forEach((group, gidx) => {
        // ------------ language ---------------------
        const current = group ?.querySelector('div[class*="language-"].active')
        Array.from(group ?.querySelectorAll('div[class*="language-"]:not(.language-id)')).forEach((next, nidx) => {
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


    window.addEventListener('click', (e) => {
      const el = e.target as HTMLInputElement

      if (el.matches('.vp-code-group input')) {
        const group = el.parentElement?.parentElement
        const i = Array.from(group?.querySelectorAll('input') || []).indexOf(el)

        // tabname/filename
        const tabname = el.nextElementSibling?.textContent

        // language
        const block = group?.querySelectorAll('div[class*="language-"]:not(.language-id)')?.[i]
        const classList = Array.from(block?.classList || [])
        const language = classList.find(v => v.startsWith('language-'))

        if (language?.slice(9)) {
          sessionStorage.setItem('vitepress-markdown-language', language)
        }

        Array.prototype.forEach.call(document ?.querySelectorAll('.vp-code-group'), (group, gidx) => {
          // ------------ tabname/filename ---------------------
          Array.from(group.querySelectorAll('input')).forEach((fel, fidx) => {
            if (fel?.nextElementSibling?.textContent === tabname) {
              if (fel !== el) fel.click()
            }
          })
          // ------------ tabname/filename ---------------------
         
          // ------------ language ---------------------
          const current = group?.querySelector('div[class*="language-"].active')
          Array.from(group?.querySelectorAll('div[class*="language-"]:not(.language-id)')).forEach((next, nidx) => {
            // language
            if (next?.classList.contains(language)) {
              if (current && next && current !== next) {
                current.classList.remove('active')
                next.classList.add('active')
              }
              const fel = group.querySelectorAll('input')[nidx]
              if (fel !== el) fel.click()
            }
          })
          // ------------ language ---------------------

        })
      }
    })
  }
}
