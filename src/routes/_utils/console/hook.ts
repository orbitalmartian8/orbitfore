import { emit } from '../eventBus.ts'
export type Log = {
  type: string
  args: unknown[]
  time: number
  stack?: string
}
export const logs: Log[] = []
if (ENAFORE_IS_BROWSER) {
  function add(log: Log) {
    if (logs.length > 100) {
      logs.shift()
    }
    logs.push(log)
    emit('console', log)
  }
  globalThis.addEventListener('unhandledrejection', (event) => {
    const log = {
      type: 'error',
      args: ['Uncaught (in promise) %o', event.reason],
      time: Date.now(),
      stack: new Error().stack,
    }
    add(log)
  })
  globalThis.addEventListener('error', (event) => {
    const log = {
      type: 'error',
      args: ['%o', event.error],
      time: Date.now(),
      stack: new Error().stack,
    }
    add(log)
  })
  globalThis.console = new Proxy(console, {
    get(target, key) {
      const real: unknown = (target as any)[key]
      if (typeof real === 'function' && typeof key === 'string') {
        return function (this: Console, ...args: any[]) {
          const log = {
            type: key,
            args,
            time: Date.now(),
            stack: new Error().stack,
          }
          add(log)
          return real.call(this, ...args)
        }
      }
    },
  })
  console.info(String.raw`  /|\    Starting Orbitalfore
_/_|_)_  Version ${ENAFORE_VERSION}
\_____/  Built for ${ENAFORE_ENV}`)
}
