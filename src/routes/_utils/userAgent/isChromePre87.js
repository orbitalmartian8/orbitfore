// @ts-check
import { isChrome } from './isChrome.js'
import { thunk } from '../thunk.js'
// https://caniuse.com/cookie-store-api
export const isChromePre87 = thunk(() => (ENAFORE_IS_BROWSER && isChrome() && typeof /** @type {any} */(globalThis).cookieStore === 'undefined'))
