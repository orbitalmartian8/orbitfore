// @ts-check
// checking for Chrome 82 because that's when this bug was fixed
// https://bugs.chromium.org/p/chromium/issues/detail?id=1053477

import { thunk } from '../thunk.js'
import { isChrome } from './isChrome.js'

function getChromeVersion () {
  try {
    return parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)[1], 10) || undefined
  } catch (e) {
    return undefined
  }
}

export const isChromePre82 = thunk(() => ENAFORE_IS_BROWSER && isChrome() && getChromeVersion() < 82)
