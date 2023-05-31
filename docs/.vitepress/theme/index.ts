import DefaultTheme from 'vitepress/theme'
import { useCodeGroups } from './composables/codeGroups'
import './custom.css'

export default {
  extends: DefaultTheme,
  async enhanceApp(ctx) {
    await useCodeGroups()
  }
}
