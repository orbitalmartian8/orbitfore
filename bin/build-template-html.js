import chokidar from 'chokidar'
import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { buildSass } from './build-sass.js'
import { buildInlineScript } from './build-inline-script.js'
import { buildSvg } from './build-svg.js'
import { performance } from 'perf_hooks'
import { debounce } from '../src/routes/_thirdparty/lodash/timers.js'
import applyIntl from '../webpack/svelte-intl-loader.js'
import { LOCALE } from '../src/routes/_static/intl.js'
import rtlDetectPackage from 'rtl-detect'

const { getLangDir } = rtlDetectPackage

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const LOCALE_DIRECTION = getLangDir(LOCALE)
const DEBOUNCE = 500

const builders = [
  {
    watch: 'src/inline-script/inline-script.js',
    comment: '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'" />',
    rebuild: buildInlineScript
  },
  {
    watch: 'src/scss',
    comment: '<!-- inline CSS -->',
    rebuild: buildSass
  },
  {
    watch: 'src/inline-script/inline-script.js',
    comment: '<!-- inline JS -->',
    rebuild: buildInlineScript
  },
  {
    watch: 'bin/svgs.js',
    comment: '<!-- inline SVG -->',
    rebuild: buildSvg
  }
]

// array of strings and builder functions, we build this on-the-fly
const partials = buildPartials()

function buildPartials () {
  const rawTemplate = readFileSync(path.resolve(__dirname, '../src/build/template.html'), 'utf8')

  const partials = [rawTemplate]

  builders.forEach(builder => {
    for (let i = 0; i < partials.length; i++) {
      const partial = partials[i]
      if (typeof partial !== 'string') {
        continue
      }
      const idx = partial.indexOf(builder.comment)
      if (idx !== -1) {
        partials.splice(
          i,
          1,
          partial.substring(0, idx),
          builder,
          partial.substring(idx + builder.comment.length)
        )
        break
      }
    }
  })

  return partials
}

function doWatch () {
  // rebuild each of the partials on-the-fly if something changes
  partials.forEach(partial => {
    if (typeof partial === 'string') {
      return
    }

    chokidar.watch(partial.watch).on('change', debounce(path => {
      console.log(`Detected change in ${path}...`)
      delete partial.result
      buildAll().catch(console.error)
    }), DEBOUNCE)
  })
}

async function buildAll () {
  const start = performance.now()
  const context = {}
  let html = (await Promise.all(partials.map(async partial => {
    if (typeof partial === 'string') {
      return partial
    }
    if (!partial.result) {
      partial.result = (partial.comment[1] === '!' ? (partial.comment + '\n') : '') + (await partial.rebuild(context))
    }
    return partial.result
  }))).join('')

  html = applyIntl(html)
    .replace('{process.env.LOCALE}', LOCALE)
    .replace('{process.env.LOCALE_DIRECTION}', LOCALE_DIRECTION)
  await writeFile(path.resolve(__dirname, '../src/template.html'), html, 'utf8')
  const end = performance.now()
  console.log(`Built template.html in ${(end - start).toFixed(2)}ms`)
}

async function main () {
  if (process.argv.includes('--watch')) {
    doWatch()
  } else {
    await buildAll()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
