// @ts-check
// We have to build this as webpack.config.cjs so that Sapper can require() it correctly,
// since Sapper is designed to only work with CommonJS

import { build } from 'esbuild'

const buildFile = (/** @type {string} */ input) =>
  build({
    bundle: true,
    format: 'cjs',
    outfile: input.replace('.js', '.cjs'),
    entryPoints: [input],
    platform: 'node',
    packages: 'external'
  })

Promise.all([
  buildFile('./webpack/webpack.config.js'),
  buildFile('./webpack/svelte-intl-loader.js'),
  buildFile('./webpack/csso-loader.js')
]).catch((e) => {
  console.error(e)
  process.exit(1)
})
