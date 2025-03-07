import {
  importDynamicViewportUnitsPolyfill,
  importRequestIdleCallback
} from './asyncPolyfills.js'
import { mark, stop } from '../marks.js'

export async function loadPolyfills () {
  mark('loadPolyfills')
  await Promise.all([
    typeof requestIdleCallback !== 'function' && importRequestIdleCallback(),
    !CSS.supports('height: 1dvh') && importDynamicViewportUnitsPolyfill()
  ])
  stop('loadPolyfills')
}
