// @ts-check
import { thunk } from '../thunk.js'

export const isChrome = thunk(() => ENAFORE_IS_BROWSER && /Chrome/.test(navigator.userAgent))
