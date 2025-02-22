// @ts-check
import { thunk } from '../thunk.js'

export const isWebKit = thunk(() => ENAFORE_IS_BROWSER && 'webkitIndexedDB' in globalThis)
