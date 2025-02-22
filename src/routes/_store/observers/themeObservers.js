import { switchToTheme } from '../../_utils/themeEngine.js'
import { database } from '../../_database/database.js'

const style = ENAFORE_IS_BROWSER && document.getElementById('theGrayscaleStyle')

export function themeObservers (store) {
  if (!ENAFORE_IS_BROWSER) {
    return
  }

  store.observe('enableGrayscale', enableGrayscale => {
    const { instanceThemes, currentInstance } = store.get()
    const theme = instanceThemes && instanceThemes[currentInstance]
    style.setAttribute('media', enableGrayscale ? 'all' : 'only x') // disable or enable the style
    switchToTheme(theme, enableGrayscale)
  }, { init: false }) // init:false because the inline script takes care of it
  store.observe('currentTheme', currentTheme => {
    database.setLastTheme(currentTheme).then(() => {
      console.log('saved theme color to idb')
    })
  })
}
