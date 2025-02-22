// @ts-check
import { thunk } from '../thunk.js'

export const isMobile = thunk(() => ENAFORE_IS_BROWSER && /(?:iPhone|iPod|iPad|Android|KAIOS)/.test(navigator.userAgent))
