import { themes } from '../_static/themes.js'
const prefersDarkTheme = ENAFORE_IS_BROWSER && matchMedia('(prefers-color-scheme: dark)').matches
const meta = ENAFORE_IS_BROWSER && document.getElementById('theThemeColor')

export const DEFAULT_LIGHT_THEME = 'default' // theme that is shown by default
export const DEFAULT_DARK_THEME = 'ozark' // theme that is shown for prefers-color-scheme:dark
export const DEFAULT_THEME = prefersDarkTheme ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME
const THEME_COLORS = process.env.THEME_COLORS ? process.env.THEME_COLORS : Object.fromEntries(themes.map(_ => ([_.name, _.color])))

function getExistingThemeLink () {
  return document.head.querySelector('link[rel=stylesheet][href^="/theme-"]')
}

function loadCSS (href) {
  const existingLink = getExistingThemeLink()

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href

  link.addEventListener('load', function onload () {
    link.removeEventListener('load', onload)
    if (existingLink) { // remove after load to avoid flash of default theme
      document.head.removeChild(existingLink)
    }
  })

  document.head.appendChild(link)
}

export function switchToTheme (themeName = DEFAULT_THEME, enableGrayscale) {
  const themeColor = THEME_COLORS[themeName]
  meta.content = themeColor || THEME_COLORS[DEFAULT_THEME]
  loadCSS(`/theme-${themeName}.css`)
}
