// the page-lifecycle package causes some problems (doesn't work in node),
// and plus it's not needed immediately, so lazy-load it
import { importPageLifecycle } from './asyncModules/importPageLifecycle.js'

type StateChangeEvent = Event & {
  newState: string
  oldState: string
  originalEvent: Event
}

function addEventListener(
  event: 'statechange',
  func: (_: StateChangeEvent) => any,
) {
  if (ENAFORE_IS_BROWSER && !ENAFORE_IS_SERVICE_WORKER) {
    importPageLifecycle().then((lifecycle) => {
      lifecycle.addEventListener(event, func)
    })
  }
}

function removeEventListener(
  event: 'statechange',
  func: (_: StateChangeEvent) => any,
) {
  if (ENAFORE_IS_BROWSER && !ENAFORE_IS_SERVICE_WORKER) {
    importPageLifecycle().then((lifecycle) => {
      lifecycle.removeEventListener(event, func)
    })
  }
}

export const lifecycle = { addEventListener, removeEventListener }
