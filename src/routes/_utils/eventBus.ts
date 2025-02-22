// @ts-check
import mitt, { type Emitter } from 'mitt'
import type { Log } from './console/hook.ts'

type Events = {
  console: Log
}
const eventBus = mitt<Events>()

if (ENAFORE_IS_BROWSER) {
  ;(window as any).__eventBus = eventBus
}

function on<Event extends keyof Events>(
  eventName: Event,
  method: (_: Events[Event]) => unknown,
): void
function on<Event extends keyof Events>(
  eventName: Event,
  component: Emitter<{ destroy: void }>,
  method: (_: Events[Event]) => unknown,
): void
function on<Event extends keyof Events>(
  eventName: Event,
  component_: ((_: Events[Event]) => unknown) | Emitter<{ destroy: void }>,
  method?: (_: Events[Event]) => unknown,
): void {
  let component: typeof component_ | void
  if (typeof method === 'undefined') {
    method = component_ as (_: Events[Event]) => unknown
    component = undefined
  } else {
    component = component_ as Emitter<{ destroy: void }>
  }
  const callback = method.bind(component)
  eventBus.on(eventName, callback)
  if (component) {
    component.on('destroy', () => {
      eventBus.off(eventName, callback)
    })
  }
}

const emit = eventBus.emit
export { eventBus, on, emit }
