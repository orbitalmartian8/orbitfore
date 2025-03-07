import { LOCALE } from '../src/routes/_static/intl'
import path from 'path'

import config from 'sapper/config/webpack.js'
import terser from './terser.config.js'
import webpack from 'webpack'
import { mode, dev, resolve, inlineThemeColors, isUpstream } from './shared.config.js'

export default {
  entry: config.serviceworker.entry(),
  output: config.serviceworker.output(),
  resolve,
  mode,
  devtool: 'source-map',
  optimization: dev
    ? {}
    : {
        minimize: !process.env.DEBUG,
        minimizer: [
          terser()
        ]
      },
  module: {
    rules: [
      {
        test: /\.[tj]s$/,
        exclude: /node_modules/,
        use: {
          loader: path.join(__dirname, './svelte-intl-loader.cjs')
        }
      },
      {
        test: /\.ts$/,
        use: {
          loader: '@sucrase/webpack-loader',
          options: {
            transforms: ['typescript']
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(mode),
      ENAFORE_ENV: JSON.stringify(mode),
      'process.env.SAPPER_TIMESTAMP': process.env.SAPPER_TIMESTAMP || Date.now(),
      'process.env.LOCALE': JSON.stringify(LOCALE),
      ENAFORE_IS_SERVICE_WORKER: 'true',
      ENAFORE_IS_BROWSER: 'true',
      'process.env.THEME_COLORS': JSON.stringify(inlineThemeColors),
      'process.env.UPSTREAM': isUpstream,
      'process.env.SINGLE_INSTANCE': JSON.stringify(process.env.SINGLE_INSTANCE)
    })
  ].filter(Boolean)
}
