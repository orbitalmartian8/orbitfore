// @ts-check
import { thunk } from '../thunk.js'

export const isKaiOS = thunk(() => ENAFORE_IS_BROWSER && /KAIOS/.test(navigator.userAgent))
