/**
 * Portions of this of this code are based on code from Deno, which is licensed as follows:
 * MIT License
 * Copyright 2018-2024 the Deno authors
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { type Component, render, createContext } from '@easrng/elements/tiny'
import inspect from 'object-inspect'
import { logs, type Log } from './hook.ts'
import { eventBus } from '../eventBus.ts'

if (ENAFORE_IS_BROWSER) {
  const DefaultFormat: Component<{ args: unknown[] }> = ({ args, html }) => {
    const first = args[0]
    let a = 0
    let out: string[] = []
    let styled: Node[] = []
    let css: string = ''
    function flush() {
      if (out.length) {
        styled.push(css ? html`<span style=${css}>${out}</span>` : html`${out}`)
        out = []
      }
    }
    if (typeof first == 'string' && args.length > 1) {
      a++
      // Index of the first not-yet-appended character. Use this so we only
      // have to append to `string` when a substitution occurs / at the end.
      let appendedChars = 0
      for (let i = 0; i < first.length - 1; i++) {
        if (first[i] == '%') {
          const char = first[++i]
          if (a < args.length) {
            let formattedArg = ''
            if (char == 's') {
              // Format as a string.
              formattedArg = String(args[a++])
            } else if (Array.prototype.includes.call(['d', 'i'], char)) {
              // Format as an integer.
              const value = args[a++]
              if (typeof value == 'bigint') {
                formattedArg = `${value}n`
              } else if (typeof value == 'number') {
                formattedArg = `${Number.parseInt(String(value))}`
              } else {
                formattedArg = 'NaN'
              }
            } else if (char == 'f') {
              // Format as a floating point value.
              const value = args[a++]
              if (typeof value == 'number') {
                formattedArg = `${value}`
              } else {
                formattedArg = 'NaN'
              }
            } else if (Array.prototype.includes.call(['O', 'o'], char)) {
              // Format as an object.
              formattedArg = inspect(args[a++])
            } else if (char == 'c') {
              const value = String(args[a++])
              flush()
              css = value
            }

            if (formattedArg != null) {
              out.push(
                String.prototype.slice.call(first, appendedChars, i - 1) +
                  formattedArg,
              )
              appendedChars = i + 1
            }
          }
          if (char == '%') {
            out.push(
              String.prototype.slice.call(first, appendedChars, i - 1) + '%',
            )
            appendedChars = i + 1
          }
        }
      }
      out.push(String.prototype.slice.call(first, appendedChars))
    }
    flush()
    css = ''

    for (; a < args.length; a++) {
      if (a > 0) {
        out.push(' ')
      }
      if (typeof args[a] == 'string') {
        out.push(String(args[a]))
      } else {
        out.push(inspect(args[a]))
      }
    }
    flush()
    return html`<span class="message">${styled}</span>`
  }
  function transpose<T>(matrix: readonly [T[], ...T[][]]): T[][] {
    return matrix[0].map((col, i) => matrix.map((row) => row[i]!))
  }
  const Table: Component<{ args: unknown[] }> = ({
    args: [data, properties],
    html,
  }) => {
    if (
      (properties !== undefined && !Array.isArray(properties)) ||
      data === null ||
      typeof data !== 'object'
    ) {
      return html`<${DefaultFormat} args=${[data, properties]} />`
    }

    let resultData: (Array<unknown> | Record<string, unknown>) & {
      [_: string]: unknown
    }
    const isSetObject = data instanceof Set
    const isMapObject = data instanceof Map
    const valuesKey = 'Values'
    const indexKey = isSetObject || isMapObject ? '(iter idx)' : '(idx)'

    if (isSetObject) {
      resultData = [...data] as any
    } else if (isMapObject) {
      let idx = 0
      resultData = {}

      Map.prototype.forEach.call(data, (v, k) => {
        resultData[idx] = { Key: k, Values: v }
        idx++
      })
    } else {
      resultData = data as any
    }

    const keys = Object.keys(resultData)
    const numRows = keys.length

    const objectValues = properties
      ? Object.fromEntries(
          properties.map((name) => [
            String(name),
            Array.prototype.fill.call(new Array(numRows), ''),
          ]),
        )
      : {}
    const indexKeys: unknown[] = []
    const values: (Node | string)[] = []

    let hasPrimitives = false
    keys.forEach((k, idx) => {
      const value = resultData[k]
      const primitive =
        value === null ||
        (typeof value !== 'function' && typeof value !== 'object')
      if (properties === undefined && primitive) {
        hasPrimitives = true
        values.push(html`<${DefaultFormat} args=${[value]} />`)
      } else {
        const valueObj: Record<string, unknown> = (value || {}) as any
        const keys = properties || Object.keys(valueObj)
        for (let i = 0; i < keys.length; ++i) {
          const k = keys[i]
          if (!primitive && Reflect.has(valueObj, k)) {
            if (!Reflect.has(objectValues, k)) {
              objectValues[k] = new Array(numRows).fill('')
            }
            objectValues[k]![idx] = html`<${DefaultFormat}
              args=${[valueObj[k]]}
            />`
          }
        }
        values.push('')
      }

      indexKeys.push(k)
    })

    const headerKeys = Object.keys(objectValues)
    const bodyValues = Object.values(objectValues)
    const headerProps = properties || [
      ...headerKeys,
      !isMapObject && hasPrimitives && valuesKey,
    ]
    const header = Array.prototype.filter.call(
      [indexKey, ...headerProps],
      Boolean,
    )
    const body = [indexKeys, ...bodyValues, values] as const
    return html`
      <div class="message">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${header.map((e) => html`<th>${e}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${transpose(body).map(
                (e) => html`
                  <tr>
                    ${e
                      .slice(0, header.length)
                      .map((e, i) =>
                        i ? html`<td>${e}</td>` : html`<th>${e}</th>`,
                      )}
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </div>
    `
  }
  const icons: Record<string, string> = {
    error: '⛔',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🐞',
    unknown: '❓',
  }
  const known = new Set([
    'log',
    'clear',
    'table',
    'assert',
    'count',
    'countReset',
    'dir',
    'dirxml',
    'exception',
    'time',
    'timeEnd',
    'timeLog',
    'timeStamp',
    'trace',
    'profile',
    'profileEnd',
    ...Object.keys(icons),
  ])
  const TimesContext = createContext<Map<string, number>>()
  const CountsContext = createContext<Map<string, number>>()
  const LogLine: Component<{ log: Log }> = ({ log, html, context }) => {
    const times = context(TimesContext)!
    const counts = context(CountsContext)!
    let stackEle: Node | string = ''
    let unknownType: string | void
    if (!known.has(log.type)) {
      unknownType = log.type
      log.type = 'unknown'
    }
    if (
      log.type === 'timeStamp' ||
      log.type === 'profile' ||
      log.type === 'profileEnd'
    ) {
      return ''
    }
    if (log.type === 'assert') {
      if (log.args[0]) return ''
      log.type = 'error'
      log.args[0] = 'Assertion failed:'
      log.args.push('\n' + log.stack)
    }
    const label = log.args[0] === undefined ? 'default' : `${log.args[0]}`
    {
      const reset = log.type === 'countReset'
      if (log.type === 'count' || log.type === 'countReset') {
        const newCount = reset ? 0 : (counts.get(label) || 0) + 1
        counts.set(label, newCount)
        if (reset) return ''
        log.args = [label + ':', newCount]
        log.type = 'count'
      }
    }
    if (log.type === 'time' || log.type === 'countReset') {
      if (times.has(label)) {
        log.type = 'warn'
        log.args = [`Timer '${label}' already exists.`]
      } else {
        times.set(label, log.time)
        return ''
      }
    }
    if (log.type === 'timeLog' || log.type === 'timeEnd') {
      if (times.has(label)) {
        log.args = [`${label}: ${log.time - times.get(label)!}ms`]
        if (log.type === 'timeEnd') {
          times.delete(label)
        }
      } else {
        log.type = 'warn'
        log.args = [`Timer '${label}' doesn't exist.`]
      }
    }
    if (log.type === 'dir' || log.type === 'dirxml') {
      log.type = 'log'
    }
    if (log.type === 'exception') {
      log.type = 'error'
    }
    if (log.type === 'trace') {
      log.args.unshift('Trace' + (log.args.length ? ':' : ''))
      log.args.push('\n' + log.stack)
    }
    const icon = icons[log.type]
      ? html`
          <span class="icon" title=${log.type} aria-label=${log.type}>
            ${icons[log.type]}
          </span>
        `
      : ''
    let content: Node
    if (log.type === 'clear') {
      content = html`<i class="message">Ignored console.clear()</i>`
    } else if (log.type === 'table') {
      content = html`<${Table} args=${log.args} />`
    } else if (log.type === 'unknown') {
      content = html`<b>${unknownType!}</b>: <${DefaultFormat}
          args=${log.args}
        />`
    } else {
      content = html`<${DefaultFormat} args=${log.args} />`
    }
    return html`
      <li class=${'log log-' + log.type}>${icon} ${content} ${stackEle}</li>
    `
  }
  class ConsoleLogs extends HTMLElement {
    _times?: Map<string, number>
    _counts?: Map<string, number>
    constructor() {
      super()
      this._onLog = this._onLog.bind(this)
    }
    connectedCallback() {
      this.textContent = ''
      const ul = document.createElement('ul')
      this.append(ul)
      this._times = new Map()
      this._counts = new Map()
      eventBus.on('console', this._onLog)
      this.firstElementChild!.append(
        render(
          ({ html }) => html`
          <${TimesContext} value=${this._times}>
            <${CountsContext} value=${this._counts}>
              ${logs.map((log) => html`<${LogLine} log=${log} />`)}
            </CountsContext>
          </TimesContext>
        `,
        ),
      )
    }
    disconnectedCallback() {
      this.textContent = ''
      eventBus.off('console', this._onLog)
    }
    _onLog(log: Log) {
      this.firstElementChild!.append(
        render(
          ({ html }) => html`
          <${TimesContext} value=${this._times}>
            <${CountsContext} value=${this._counts}>
              <${LogLine} log=${log} />
            </CountsContext>
          </TimesContext>`,
        ),
      )
    }
  }
  customElements.define('easrng-console-logs', ConsoleLogs)
}
