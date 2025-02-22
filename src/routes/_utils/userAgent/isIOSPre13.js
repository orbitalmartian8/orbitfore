// @ts-check
// PointerEvent introduced in iOS 13 https://caniuse.com/#feat=pointer
import { thunk } from '../thunk.js'
import { isIOS } from '../userAgent/isIOS.js'

export const isIOSPre13 = thunk(() => ENAFORE_IS_BROWSER && isIOS() &&
  !(typeof PointerEvent === 'function' &&
    PointerEvent.toString().includes('[native code]')))
