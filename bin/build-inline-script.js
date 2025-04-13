// @ts-check
import crypto from 'crypto'
import { writeFile } from 'fs/promises'
import path from 'path'
import { inlineThemeColors } from '../webpack/shared.config.js'
import { sapperInlineScriptChecksums } from '../src/server/sapperInlineScriptChecksums.js'
import { build } from 'esbuild'
import applyIntl from '../webpack/svelte-intl-loader.js'
import MagicString from 'magic-string'
import remap from '@ampproject/remapping'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

async function buildInlineScriptAndCSP () {
  const inlineScriptPath = path.join(
    __dirname,
    '../src/inline-script/inline-script.js'
  )

  const bundle = await build({
    entryPoints: [inlineScriptPath],
    define: {
      ENAFORE_IS_BROWSER: 'true',
      'process.env.THEME_COLORS': JSON.stringify(inlineThemeColors)
    },
    minify: true,
    bundle: true,
    format: 'iife',
    sourcemap: 'external',
    write: false,
    outfile: 'inline-script.js',
    sourceRoot: 'webpack:///'
  })
  /** @type {{js: string, map:string}} */
  let { js, map } = Object.fromEntries(
    bundle.outputFiles.map((e) => [e.path.split('.').at(-1), e.text])
  )

  let ms = new MagicString(js)
  ms = applyIntl(ms)
  js = ms.toString() + '//# sourceMappingURL=/inline-script.js.map'
  map = remap(
    [
      ms.generateMap({
        includeContent: true,
        hires: 'boundary'
      }),
      JSON.parse(map)
    ],
    () => null
  ).toString()

  const SCRIPT_CHECKSUMS = [
    crypto.createHash('sha256').update(js, 'utf8').digest('base64'),
    ...sapperInlineScriptChecksums
  ]
    .map((_) => `'sha256-${_}'`)
    .join(' ')
  const policy = [
    "default-src 'self'",
    `script-src 'self' ${SCRIPT_CHECKSUMS}`,
    "worker-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' * data: blob:",
    "media-src 'self' *",
    "connect-src 'self' * data: blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
    "form-action 'self' https://duckduckgo.com", // we need form-action for the Web Share Target API and MFM [search] tags
    "base-uri 'self'"
  ].join(';')
  await writeFile(
    path.resolve(__dirname, '../static/inline-script.js.map'),
    map,
    'utf8'
  )
  return {
    inlineScript: `<script>${js}</script>`,
    csp: `<meta http-equiv="Content-Security-Policy" content="${policy}" />`
  }
}

export function buildInlineScript (context) {
  if (context.inlineScript) {
    return context.inlineScript
  } else {
    const promise = buildInlineScriptAndCSP()
    context.inlineScript = promise.then((e) => e.inlineScript)
    return promise.then((e) => e.csp)
  }
}
