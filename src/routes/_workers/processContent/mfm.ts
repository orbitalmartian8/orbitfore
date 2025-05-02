/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MfmNode, parse as parseMFM } from 'mfm-js'
import {
  DefaultTreeAdapterMap,
  defaultTreeAdapter,
  html,
  parseFragment,
} from 'parse5'
import { Mention } from '../../_utils/types.ts'
const {
  NS: { HTML, SVG },
} = html

function safeParseFloat(str: unknown): number | null {
  if (typeof str !== 'string' || str === '') return null
  const num = parseFloat(str)
  if (isNaN(num)) return null
  return num
}

declare global {
  interface RegExp {
    test(_: string | boolean): boolean
  }
}

function append(
  parent: DefaultTreeAdapterMap['parentNode'],
  children: Array<DefaultTreeAdapterMap['childNode'] | string>,
) {
  for (const node of children) {
    if (typeof node === 'string') {
      defaultTreeAdapter.insertText(parent, node)
    } else {
      defaultTreeAdapter.appendChild(parent, node)
    }
  }
}
export function renderMfm({
  mfmContent,
  htmlContent,
  autoplayGifs,
  emojis,
  mentionsByURL,
  mentionsByAcct,
  mentionsByLowerAcct,
}: {
  mfmContent: string
  htmlContent: string
  autoplayGifs: boolean
  emojis: Map<string, { shortcode: string; url: string; static_url: string }>
  mentionsByURL: Map<string, Mention>
  mentionsByAcct: Map<string, Mention>
  mentionsByLowerAcct: Map<string, Mention>
}) {
  const mentionUrlsFromHtml: string[] = []
  function walkElements(node: DefaultTreeAdapterMap['parentNode']): void {
    for (const child of node.childNodes) {
      if (defaultTreeAdapter.isElementNode(child)) {
        if (child.tagName === 'a') {
          const c = child.attrs.find((attr) => attr.name === 'class')
          const h = child.attrs.find((attr) => attr.name === 'href')
          if (c && h && /(?:\s|^)mention(?:\s|$)/.test(c.value)) {
            defaultTreeAdapter.detachNode(child)
            mentionUrlsFromHtml.push(h.value)
            continue
          }
        }
        walkElements(child)
      }
    }
  }
  walkElements(parseFragment(htmlContent))
  console.log(
    'mentionUrlsFromHtml',
    mentionUrlsFromHtml,
    'mentionsByURL',
    mentionsByURL,
  )
  const rootAst = parseMFM(mfmContent)
  const validTime = (t: string | boolean | null | undefined) => {
    if (t == null) return null
    if (typeof t === 'boolean') return null
    return t.match(/^[0-9.]+s$/) ? t : null
  }
  const validColor = (c: unknown): string | null => {
    if (typeof c !== 'string') return null
    return c.match(/^[0-9a-f]{3,6}$/i) ? c : null
  }
  const useAnim = autoplayGifs
  const simpleTagMap = {
    bold: 'b',
    strike: 'del',
    italic: 'i',
    quote: 'blockquote',
    plain: 'span',
  }
  let mentionsEncountered = 0
  const genEl = (
    ast: MfmNode[],
    scale: number,
    parent: DefaultTreeAdapterMap['parentNode'],
  ): void => {
    for (const token of ast) {
      switch (token.type) {
        case 'text':
          {
            const text = token.props.text.replace(/(\r\n|\n|\r)/g, '\n')
            const res = []
            for (const t of text.split('\n')) {
              res.push(defaultTreeAdapter.createElement('br', HTML, []))
              res.push(t)
            }
            res.shift()
            append(parent, res)
          }
          break
        case 'bold':
        case 'strike':
        case 'italic':
        case 'plain':
        case 'quote':
          {
            const ele = defaultTreeAdapter.createElement(
              simpleTagMap[token.type],
              HTML,
              [],
            )
            genEl(token.children, scale, ele)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'fn':
          {
            // TODO: CSSを文字列で組み立てていくと token.props.args.~~~ 経由でCSSインジェクションできるのでよしなにやる
            let style: string | undefined
            switch (token.props.name) {
              case 'tada': {
                const speed = validTime(token.props.args.speed) ?? '1s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style =
                  'font-size: 150%;' +
                  (useAnim
                    ? `animation: global-tada ${speed} linear infinite both; animation-delay: ${delay};`
                    : '')
                break
              }
              case 'jelly': {
                const speed = validTime(token.props.args.speed) ?? '1s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = useAnim
                  ? `animation: mfm-rubberBand ${speed} linear infinite both; animation-delay: ${delay};`
                  : ''
                break
              }
              case 'twitch': {
                const speed = validTime(token.props.args.speed) ?? '0.5s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = useAnim
                  ? `animation: mfm-twitch ${speed} ease infinite; animation-delay: ${delay};`
                  : ''
                break
              }
              case 'shake': {
                const speed = validTime(token.props.args.speed) ?? '0.5s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = useAnim
                  ? `animation: mfm-shake ${speed} ease infinite; animation-delay: ${delay};`
                  : ''
                break
              }
              case 'spin': {
                const direction = token.props.args.left
                  ? 'reverse'
                  : token.props.args.alternate
                    ? 'alternate'
                    : 'normal'
                const anime = token.props.args.x
                  ? 'mfm-spinX'
                  : token.props.args.y
                    ? 'mfm-spinY'
                    : 'mfm-spin'
                const speed = validTime(token.props.args.speed) ?? '1.5s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = useAnim
                  ? `animation: ${anime} ${speed} linear infinite; animation-direction: ${direction}; animation-delay: ${delay};`
                  : ''
                break
              }
              case 'jump': {
                const speed = validTime(token.props.args.speed) ?? '0.75s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = useAnim
                  ? `animation: mfm-jump ${speed} linear infinite; animation-delay: ${delay};`
                  : ''
                break
              }
              case 'bounce': {
                const speed = validTime(token.props.args.speed) ?? '0.75s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = useAnim
                  ? `animation: mfm-bounce ${speed} linear infinite; transform-origin: center bottom; animation-delay: ${delay};`
                  : ''
                break
              }
              case 'flip': {
                const transform =
                  token.props.args.h && token.props.args.v
                    ? 'scale(-1, -1)'
                    : token.props.args.v
                      ? 'scaleY(-1)'
                      : 'scaleX(-1)'
                style = `transform: ${transform};`
                break
              }
              case 'x2':
              case 'x3':
              case 'x4': {
                const ele = defaultTreeAdapter.createElement('span', HTML, [
                  { name: 'class', value: 'mfm-' + token.props.name },
                ])
                genEl(token.children, scale * +token.props.name[1]!, ele)
                defaultTreeAdapter.appendChild(parent, ele)
                continue
              }
              case 'font': {
                const family = token.props.args.serif
                  ? 'serif'
                  : token.props.args.monospace
                    ? 'monospace'
                    : token.props.args.cursive
                      ? 'cursive'
                      : token.props.args.fantasy
                        ? 'fantasy'
                        : token.props.args.emoji
                          ? 'emoji'
                          : token.props.args.math
                            ? 'math'
                            : null
                if (family) {
                  style = `font-family: ${family};`
                }
                break
              }
              case 'blur': {
                const ele = defaultTreeAdapter.createElement('span', HTML, [
                  { name: 'class', value: '_mfm_blur_' },
                ])
                genEl(token.children, scale, ele)
                defaultTreeAdapter.appendChild(parent, ele)
                continue
              }
              case 'rainbow': {
                if (!useAnim) {
                  const ele = defaultTreeAdapter.createElement('span', HTML, [
                    { name: 'class', value: '_mfm_rainbow_fallback_' },
                  ])
                  genEl(token.children, scale, ele)
                  defaultTreeAdapter.appendChild(parent, ele)
                  continue
                }
                const speed = validTime(token.props.args.speed) ?? '1s'
                const delay = validTime(token.props.args.delay) ?? '0s'
                style = `animation: mfm-rainbow ${speed} linear infinite; animation-delay: ${delay};`
                break
              }
              case 'sparkle': {
                const ele = defaultTreeAdapter.createElement(
                  useAnim ? 'easrng-sparkle' : 'span',
                  HTML,
                  [],
                )
                genEl(token.children, scale, ele)
                defaultTreeAdapter.appendChild(parent, ele)
                continue
              }
              case 'rotate': {
                const degrees = safeParseFloat(token.props.args.deg) ?? 90
                style = `transform: rotate(${degrees}deg); transform-origin: center center;`
                break
              }
              case 'position': {
                const x = safeParseFloat(token.props.args.x) ?? 0
                const y = safeParseFloat(token.props.args.y) ?? 0
                style = `transform: translateX(${x}em) translateY(${y}em);`
                break
              }
              case 'scale': {
                const x = Math.min(safeParseFloat(token.props.args.x) ?? 1, 5)
                const y = Math.min(safeParseFloat(token.props.args.y) ?? 1, 5)
                style = `transform: scale(${x}, ${y});`
                scale = scale * Math.max(x, y)
                break
              }
              case 'fg': {
                let color = validColor(token.props.args.color)
                color = color ?? 'f00'
                style = `color: #${color}; overflow-wrap: anywhere;`
                break
              }
              case 'bg': {
                let color = validColor(token.props.args.color)
                color = color ?? 'f00'
                style = `background-color: #${color}; overflow-wrap: anywhere;`
                break
              }

              case 'border': {
                let color = validColor(token.props.args.color)
                color = color ? `#${color}` : 'var(--main-theme-color)'
                let b_style = token.props.args.style
                if (
                  typeof b_style !== 'string' ||
                  ![
                    'hidden',
                    'dotted',
                    'dashed',
                    'solid',
                    'double',
                    'groove',
                    'ridge',
                    'inset',
                    'outset',
                  ].includes(b_style)
                )
                  b_style = 'solid'
                const width = safeParseFloat(token.props.args.width) ?? 1
                const radius = safeParseFloat(token.props.args.radius) ?? 0
                style = `border: ${width}px ${b_style} ${color}; border-radius: ${radius}px;${token.props.args.noclip ? '' : ' overflow: clip;'}`
                break
              }
              case 'ruby': {
                if (token.children.length === 1) {
                  const child = token.children[0]
                  let text = child?.type === 'text' ? child.props.text : ''
                  const ruby = defaultTreeAdapter.createElement(
                    'ruby',
                    HTML,
                    [],
                  )
                  const split = text.split(' ')
                  defaultTreeAdapter.insertText(ruby, split[0] ?? '')
                  const rt = defaultTreeAdapter.createElement('rt', HTML, [])
                  defaultTreeAdapter.insertText(rt, split[1] ?? '')
                  defaultTreeAdapter.appendChild(ruby, rt)
                  defaultTreeAdapter.appendChild(parent, ruby)
                  continue
                } else {
                  const lastChild = token.children[token.children.length - 1]
                  let text =
                    lastChild?.type === 'text' ? lastChild.props.text : ''
                  const ruby = defaultTreeAdapter.createElement(
                    'ruby',
                    HTML,
                    [],
                  )
                  genEl(
                    token.children.slice(0, token.children.length - 1),
                    scale,
                    ruby,
                  )
                  const rt = defaultTreeAdapter.createElement('rt', HTML, [])
                  defaultTreeAdapter.insertText(rt, text.trim())
                  defaultTreeAdapter.appendChild(ruby, rt)
                  defaultTreeAdapter.appendChild(parent, ruby)
                  continue
                }
              }
              case 'unixtime': {
                const child = token.children[0]
                const unixtime = parseInt(
                  child?.type === 'text' ? child.props.text : '',
                )
                const date = new Date(unixtime * 1000)
                const ele = defaultTreeAdapter.createElement('time', HTML, [
                  { name: 'datetime', value: date.toJSON() },
                  { name: 'class', value: '_mfm_unixtime_' },
                ])
                defaultTreeAdapter.insertText(ele, date.toLocaleString())
                defaultTreeAdapter.appendChild(parent, ele)
                continue
              }
              case 'clickable': {
                const clickEv =
                  typeof token.props.args.ev === 'string'
                    ? token.props.args.ev
                    : ''
                const ele = defaultTreeAdapter.createElement('span', HTML, [
                  { name: 'data-mfm-clickable-ev', value: clickEv },
                ])
                genEl(token.children, scale, ele)
                defaultTreeAdapter.appendChild(parent, ele)
                continue
              }
            }
            if (style === undefined) {
              const ele = defaultTreeAdapter.createElement('span', HTML, [])
              defaultTreeAdapter.insertText(ele, `$[${token.props.name} `)
              genEl(token.children, scale, ele)
              defaultTreeAdapter.insertText(ele, ']')
              defaultTreeAdapter.appendChild(parent, ele)
            } else {
              const ele = defaultTreeAdapter.createElement('span', HTML, [
                {
                  name: 'style',
                  value: 'display:inline-block;' + style,
                },
              ])
              genEl(token.children, scale, ele)
              defaultTreeAdapter.appendChild(parent, ele)
            }
          }
          break
        case 'small':
          {
            const ele = defaultTreeAdapter.createElement('small', HTML, [
              {
                name: 'style',
                value: 'opacity:0.7',
              },
            ])
            genEl(token.children, scale, ele)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'center':
          {
            const ele = defaultTreeAdapter.createElement('div', HTML, [
              {
                name: 'style',
                value: 'text-align:center',
              },
            ])
            genEl(token.children, scale, ele)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'url':
          {
            const ele = defaultTreeAdapter.createElement('a', HTML, [
              {
                name: 'title',
                value: token.props.url,
              },
              {
                name: 'href',
                value: token.props.url,
              },
              {
                name: 'target',
                value: '_blank',
              },
              {
                name: 'rel',
                value: 'nofollow noopener ugc',
              },
            ])
            defaultTreeAdapter.insertText(ele, token.props.url)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'link':
          {
            const ele = defaultTreeAdapter.createElement('a', HTML, [
              {
                name: 'title',
                value: token.props.url,
              },
              {
                name: 'href',
                value: token.props.url,
              },
              {
                name: 'target',
                value: '_blank',
              },
              {
                name: 'rel',
                value: 'nofollow noopener ugc',
              },
            ])
            genEl(token.children, scale, ele)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'mention':
          {
            const url = mentionUrlsFromHtml[mentionsEncountered++]
            if (!url) {
              console.warn(
                'more mentions in mfm than in html. parser differences?',
              )
            }
            let acct = token.props.username
            if (token.props.host) {
              acct += '@' + token.props.host
            }
            const mention =
              mentionsByAcct.get(acct) ||
              mentionsByLowerAcct.get(acct.toLowerCase()) ||
              (url ? mentionsByURL.get(url) : null)
            if (
              mention?.username.toLowerCase() !==
              token.props.username.toLowerCase()
            ) {
              console.warn('failed to get mention for', '@' + acct)
              const ele = defaultTreeAdapter.createElement('a', HTML, [
                {
                  name: 'class',
                  value: 'mention',
                },
                {
                  name: 'href',
                  value: '/search?q=' + encodeURIComponent('@' + acct),
                },
                {
                  name: 'title',
                  value: '@' + acct,
                },
              ])
              defaultTreeAdapter.insertText(ele, '@' + token.props.username)
              defaultTreeAdapter.appendChild(parent, ele)
              break
            }
            mention.included = true
            const ele = defaultTreeAdapter.createElement('a', HTML, [
              {
                name: 'class',
                value: 'mention',
              },
              {
                name: 'href',
                value: '/accounts/' + mention.id,
              },
              {
                name: 'title',
                value: '@' + mention.acct,
              },
            ])
            defaultTreeAdapter.insertText(ele, '@' + mention.username)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'hashtag':
          {
            const ele = defaultTreeAdapter.createElement('a', HTML, [
              {
                name: 'class',
                value: 'hashtag',
              },
              {
                name: 'href',
                value: '/tags/' + encodeURIComponent(token.props.hashtag),
              },
              {
                name: 'rel',
                value: 'tag',
              },
              {
                name: 'data-tag',
                value: token.props.hashtag,
              },
            ])
            defaultTreeAdapter.insertText(ele, '#' + token.props.hashtag)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'blockCode':
        case 'inlineCode':
          {
            const ele = defaultTreeAdapter.createElement(
              token.type < 'i' ? 'pre' : 'code',
              HTML,
              [],
            )
            defaultTreeAdapter.insertText(ele, token.props.code)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'emojiCode':
          {
            const emoji = emojis.get(token.props.name)
            if (emoji == null) {
              defaultTreeAdapter.insertText(parent, `:${token.props.name}:`)
              break
            }
            const urlToUse = autoplayGifs ? emoji.url : emoji.static_url
            const shortcodeWithColons = `:${emoji.shortcode}:`
            const ele = defaultTreeAdapter.createElement('img', HTML, [
              {
                name: 'class',
                value: 'inline-custom-emoji',
              },
              {
                name: 'src',
                value: urlToUse,
              },
              {
                name: 'alt',
                value: shortcodeWithColons,
              },
              {
                name: 'title',
                value: shortcodeWithColons,
              },
              {
                name: 'draggable',
                value: 'false',
              },
            ])
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'unicodeEmoji':
          {
            const ele = defaultTreeAdapter.createElement('span', HTML, [
              { name: 'class', value: 'inline-emoji' },
            ])
            defaultTreeAdapter.insertText(ele, token.props.emoji)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'mathInline':
        case 'mathBlock':
          {
            const ele = defaultTreeAdapter.createElement(
              token.type[4]! < 'I' ? 'pre' : 'code',
              HTML,
              [{ name: 'class', value: 'to-katexify' }],
            )
            defaultTreeAdapter.insertText(ele, token.props.formula)
            defaultTreeAdapter.appendChild(parent, ele)
          }
          break
        case 'search':
          {
            const form = defaultTreeAdapter.createElement('form', HTML, [
              {
                name: 'class',
                value: '_mfm_search_',
              },
              {
                name: 'action',
                value: 'https://duckduckgo.com',
              },
              {
                name: 'target',
                value: '_blank',
              },
            ])
            const button = defaultTreeAdapter.createElement('button', HTML, [
              {
                name: 'aria-label',
                value: 'intl.search',
              },
              {
                name: 'class',
                value: 'search-button',
              },
            ])
            const svg = defaultTreeAdapter.createElement('svg', SVG, [
              {
                name: 'aria-label',
                value: '',
              },
              {
                name: 'aria-hidden',
                value: 'true',
              },
              {
                name: 'class',
                value: 'search-button-svg',
              },
            ])
            const use = defaultTreeAdapter.createElement('use', SVG, [
              {
                name: 'href',
                value: '#fa-search',
              },
            ])
            defaultTreeAdapter.appendChild(svg, use)
            defaultTreeAdapter.appendChild(button, svg)
            const input = defaultTreeAdapter.createElement('input', HTML, [
              {
                name: 'value',
                value: token.props.query,
              },
              {
                name: 'name',
                value: 'q',
              },
              {
                name: 'readonly',
                value: '',
              },
              {
                name: 'type',
                value: 'text',
              },
            ])
            defaultTreeAdapter.appendChild(form, input)
            defaultTreeAdapter.appendChild(form, button)
            defaultTreeAdapter.appendChild(parent, form)
          }
          break
        default:
          return token
      }
    }
  }
  const ele = defaultTreeAdapter.createElement('div', HTML, [])
  genEl(rootAst, 1, ele)
  return ele
}
