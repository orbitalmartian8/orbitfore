import { DEFAULT_LOCALE, LOCALE } from '../src/routes/_static/intl.js'

import enUS from '../src/intl/en-US.js'
import fr from '../src/intl/fr.js'
import de from '../src/intl/de.js'
import es from '../src/intl/es.js'
import parse from 'format-message-parse'

// TODO: make it so we don't have to explicitly list these out
const locales = {
  'en-US': enUS,
  fr,
  de,
  es
}

const intl = locales[LOCALE]
const defaultIntl = locales[DEFAULT_LOCALE]

export function warningOrError (message) { // avoid crashing the whole server on `pnpm dev`
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message)
  }
  console.warn(message)
  return '(Placeholder intl string)'
}

const cache = {}
export function getIntl (key) {
  if (cache[key]) return cache[key]
  const res = intl[key] || defaultIntl[key]
  if (typeof res !== 'string') {
    return warningOrError('Unknown intl string: ' + key)
  }
  const parsed = parse(res.trim().replace(/\s+/g, ' '))
  if (parsed.length === 1 && typeof parsed[0] === 'string') {
    cache[key] = parsed[0]
    return cache[key]
  }
  cache[key] = parsed
  return parsed
}
