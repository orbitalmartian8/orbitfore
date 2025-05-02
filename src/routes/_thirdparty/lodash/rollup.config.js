import resolve from '@rollup/plugin-node-resolve'

function createConfig (file) {
  const input = `./src/routes/_thirdparty/lodash/${file}`
  return {
    input,
    output: {
      file: input.replace('.src.js', '.js'),
      format: 'esm'
    },
    plugins: [
      resolve(),
      {
        name: 'add-header',
        transform (code) {
          return '/* eslint-disable */\n' + code
        }
      }
    ]
  }
}

export default [
  createConfig('timers.src.js')
]
