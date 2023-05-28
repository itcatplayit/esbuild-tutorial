import DefaultTheme from 'vitepress/theme'
import { useCodeGroups } from './composables/codeGroups'

export default {
  extends: DefaultTheme,
  async enhanceApp(ctx) {
    await useCodeGroups()
  }
}
