import { supportsFocusVisible } from '../../_utils/supportsFocusVisible.js'

export function focusRingObservers (store) {
  if (!ENAFORE_IS_BROWSER) {
    return
  }

  const styleId = supportsFocusVisible() ? 'theFocusVisibleStyle' : 'theFocusVisiblePolyfillStyle'
  const style = document.getElementById(styleId)

  store.observe('alwaysShowFocusRing', alwaysShowFocusRing => {
    style.setAttribute('media', alwaysShowFocusRing ? 'only x' : 'all') // disable or enable the style
  })
}
