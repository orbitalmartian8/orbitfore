import { store } from '../store.js'
import { isChromePre87 } from '../../_utils/userAgent/isChromePre87.js'

export function badgeObservers () {
  if (!ENAFORE_IS_BROWSER) {
    return
  }
  // Chrome 86 on Linux in Circle CI seems to hang just by checking for this... not worth supporting.
  if (isChromePre87() || !('setAppBadge' in navigator)) {
    return
  }
  store.observe('badgeNumber', badgeNumber => {
    if (badgeNumber) {
      navigator.setAppBadge(badgeNumber)
    } else {
      navigator.clearAppBadge()
    }
  })
}
