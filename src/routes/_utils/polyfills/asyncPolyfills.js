export const importRequestIdleCallback = () => import(
  /* webpackChunkName: '$polyfill$-requestidlecallback' */ 'requestidlecallback'
)

export const importFocusVisible = () => import(
  /* webpackChunkName: '$polyfill$-focus-visible' */ 'focus-visible'
)

export const importDynamicViewportUnitsPolyfill = () => import(
  /* webpackChunkName: '$polyfill$-dynamic-viewport-units' */ '../../_thirdparty/large-small-dynamic-viewport-units-polyfill/dynamic-viewport-utils-polyfill.js'
)
