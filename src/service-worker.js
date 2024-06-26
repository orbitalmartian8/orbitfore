import {
  assets as __assets__,
  shell as __shell__,
  routes as __routes__
} from '../__sapper__/service-worker.js'
import { get, post } from './routes/_utils/ajax.js'
import {
  setWebShareData,
  closeKeyValIDBConnection
} from './routes/_database/webShare.js'
import { getLastTheme, getIconColors } from './routes/_database/theme.js'
import { getKnownInstances } from './routes/_database/knownInstances.js'
import { basename } from './routes/_api/utils.js'
import { canonicalStatusUrl } from './routes/_utils/canonicalStatusUrl.js'

const timestamp = process.env.SAPPER_TIMESTAMP
const ASSETS = `assets_${timestamp}`
const WEBPACK_ASSETS = `webpack_assets_${timestamp}`

const ASSETS_ON_DEMAND_CACHE = /\.woff2?$|traineddata\.gz$/
const WEBPACK_ASSETS_ON_DEMAND_CACHE = /\.woff2?$|\.ttf$|tesseract-core\.wasm$|\$(polyfill|katex)\$/

// `static` is an array of everything in the `static` directory
const assets = __assets__
  .map(file => (file.startsWith('/') ? file : `/${file}`))
  .filter(filename => !filename.endsWith('.map'))
  .filter(filename => filename !== '/robots.txt')
  .filter(filename => !filename.includes('traineddata.gz')) // cache on-demand
  .filter(filename => !filename.endsWith('.webapp')) // KaiOS manifest
  .filter(filename => !/emoji-.*?\.json$/.test(filename)) // useless to cache; it already goes in IndexedDB
  .filter(filename => !/screenshot-.*?\.png/.test(filename)) // only used during PWA installation, don't bother caching
  .filter(filename => !ASSETS_ON_DEMAND_CACHE.test(filename))

// `shell` is an array of all the files generated by webpack
// also contains '/index.html' for some reason
const webpackAssets = __shell__
  .filter(filename => !filename.endsWith('.map')) // don't bother with sourcemaps
  .filter(filename => !filename.includes('LICENSE')) // don't bother with license files
  .filter(filename => !WEBPACK_ASSETS_ON_DEMAND_CACHE.test(filename))

// `routes` is an array of `{ pattern: RegExp }` objects that
// match the pages in your src
const routes = __routes__

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      await Promise.all([
        caches.open(WEBPACK_ASSETS).then(cache => cache.addAll(webpackAssets)),
        caches.open(ASSETS).then(cache => cache.addAll(assets))
      ])
      // We shouldn't have to do this, but the previous page could be an old one,
      // which would not send us a postMessage to skipWaiting().
      self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()

      // delete old asset/ondemand caches
      for (const key of keys) {
        if (key !== ASSETS && !key.startsWith('webpack_assets_')) {
          await caches.delete(key)
        }
      }

      // for webpack static, keep the two latest builds because we may need
      // them when the service worker has installed but the page has not
      // yet reloaded (e.g. when it gives the toast saying "please reload"
      // but then you don't refresh and instead load an async chunk)
      const webpackKeysToDelete = keys
        .filter(key => key.startsWith('webpack_assets_'))
        .sort((a, b) => {
          const aTimestamp = parseInt(a.substring(15), 10)
          const bTimestamp = parseInt(b.substring(15), 10)
          return bTimestamp < aTimestamp ? -1 : 1
        })
        .slice(2)

      for (const key of webpackKeysToDelete) {
        await caches.delete(key)
      }

      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)

  const sameOrigin = url.origin === self.origin
  if (!(sameOrigin && url.protocol.startsWith('http'))) {
    return
  }
  event.respondWith(
    (async () => {
      if (url.pathname === '/manifest.json') {
        const manifest = await (
          (await caches.match('/manifest.json')) ||
          (await fetch('/manifest.json'))
        ).json()
        manifest.theme_color =
          process.env.THEME_COLORS[await getLastTheme()] ||
          manifest.theme_color
        manifest.name = manifest.short_name = process.env.UPSTREAM ? 'Enafore' : location.hostname
        if ((await getIconColors()) === 'alt') {
          for (const icon of manifest.icons) {
            icon.src = icon.src.replace(
              /^(\/icons\/(?:apple-touch-icon|icon-(?:512|192)(?:-maskable)?)).png$/,
              '$1-alt.png'
            )
          }
        }
        await closeKeyValIDBConnection() // don't need to keep the IDB connection open
        return new Response(JSON.stringify(manifest), {
          headers: {
            'content-type': 'application/json'
          }
        })
      }
      if (url.pathname === '/theme-sw.css') {
        const theme = await getLastTheme()
        if (theme) {
          const response = await caches.match('/theme-' + theme + '.css')
          if (response) {
            return response
          }
        }
      }
      if (req.method === 'POST' && url.pathname === '/share') {
        // handle Web Share Target requests (see manifest.json)
        const formData = await req.formData()
        const title = formData.get('title')
        const text = formData.get('text')
        const url = formData.get('url')
        const file = formData.get('file')
        await setWebShareData({ title, text, url, file })
        await closeKeyValIDBConnection() // don't need to keep the IDB connection open
        return Response.redirect(
          '/?pwa=true&compose=true', // pwa=true because this can only be invoked from a PWA
          303 // 303 recommended by https://web.dev/web-share-target/
        )
      }

      // always serve webpack-generated resources and
      // static from the cache if possible
      const response = await caches.match(req)
      if (response) {
        return response
      }

      for (const [regex, cache] of [[ASSETS_ON_DEMAND_CACHE, ASSETS], [WEBPACK_ASSETS_ON_DEMAND_CACHE, WEBPACK_ASSETS]]) {
        if (regex.test(url.pathname)) {
          // cache this on-demand
          const response = await fetch(req)
          if (response && response.status >= 200 && response.status < 300) {
            const clonedResponse = response.clone()
            /* no await */
            caches.open(cache).then(cache => cache.put(req, clonedResponse))
          }
          return response
        }
      }

      // for routes, serve the /service-worker-index.html file from the most recent
      // static cache
      if (routes.find(route => route.pattern.test(url.pathname))) {
        const response = await caches.match('/service-worker-index.html')
        if (response) {
          return response
        }
      }
      return fetch(req)
    })().catch(error => {
      console.error(error)
      return new Response('error in service worker', { status: 502 })
    })
  )
})

self.addEventListener('push', event => {
  event.waitUntil(
    (async () => {
      const data = event.data.json()
      // If there is only once instance, then we know for sure that the push notification came from it
      const knownInstances = await getKnownInstances()
      if (knownInstances.length !== 1) {
        // TODO: Mastodon currently does not tell us which instance the push notification came from.
        // So we have to guess and currently just choose the first one. We _could_ locally store the instance that
        // currently has push notifications enabled, but this would only work for one instance at a time.
        // See: https://github.com/mastodon/mastodon/issues/22183
        await showSimpleNotification(data)
        return
      }

      const origin = basename(knownInstances[0])
      try {
        const notification = await get(
          `${origin}/api/v1/notifications/${data.notification_id}`,
          {
            Authorization: `Bearer ${data.access_token}`
          },
          { timeout: 2000 }
        )

        await showRichNotification(data, notification)
      } catch (e) {
        await showSimpleNotification(data)
      }
    })()
  )
})

async function showSimpleNotification (data) {
  await self.registration.showNotification(data.title, {
    badge: '/icon-push-badge.png',
    icon: data.icon,
    body: data.body,
    tag: data.notification_id,
    data: {
      url: `${self.origin}/notifications`
    }
  })
}

async function showRichNotification (data, notification) {
  const { icon, body } = data
  const tag = notification.id
  const { origin } = self.location
  const badge = '/icon-push-badge.png'

  switch (notification.type) {
    case 'follow':
    case 'follow_request':
    case 'admin.report':
    case 'admin.sign_up': {
      await self.registration.showNotification(data.title, {
        badge,
        icon,
        body,
        tag,
        data: {
          url: `${origin}/accounts/${notification.account.id}`
        }
      })
      break
    }
    case 'reblog':
    case 'favourite':
    case 'status':
    case 'poll': {
      await self.registration.showNotification(data.title, {
        badge,
        icon,
        body,
        tag,
        data: {
          url: origin + canonicalStatusUrl(notification.status)
        }
      })
      break
    }
    case 'mention': {
      const isPublic = ['public', 'unlisted'].includes(
        notification.status.visibility
      )
      const actions = [
        isPublic && {
          action: 'reblog',
          icon: '/icon-push-fa-retweet.png', // generated manually from font-awesome-svg
          title: 'intl.reblog'
        },
        {
          action: 'favourite',
          icon: '/icon-push-fa-star.png', // generated manually from font-awesome-svg
          title: 'intl.favorite'
        }
      ].filter(Boolean)

      await self.registration.showNotification(data.title, {
        badge,
        icon,
        body,
        tag,
        data: {
          instance: new URL(data.icon).origin,
          status_id: notification.status.id,
          access_token: data.access_token,
          url: origin + canonicalStatusUrl(notification.status)
        },
        actions
      })
      break
    }
  }
}

const cloneNotification = notification => {
  const clone = {}

  for (const k in notification) {
    // deliberately not doing a hasOwnProperty check, but skipping
    // functions and null props like onclick and onshow and showTrigger
    if (typeof notification[k] !== 'function' && notification[k] !== null) {
      clone[k] = notification[k]
    }
  }

  return clone
}

const updateNotificationWithoutAction = (notification, action) => {
  const newNotification = cloneNotification(notification)

  newNotification.actions = newNotification.actions.filter(
    item => item.action !== action
  )

  return self.registration.showNotification(
    newNotification.title,
    newNotification
  )
}

self.addEventListener('notificationclick', event => {
  event.waitUntil(
    (async () => {
      switch (event.action) {
        case 'reblog': {
          const url = `${event.notification.data.instance}/api/v1/statuses/${event.notification.data.status_id}/reblog`
          await post(url, null, {
            Authorization: `Bearer ${event.notification.data.access_token}`
          })
          await updateNotificationWithoutAction(event.notification, 'reblog')
          break
        }
        case 'favourite': {
          const url = `${event.notification.data.instance}/api/v1/statuses/${event.notification.data.status_id}/favourite`
          await post(url, null, {
            Authorization: `Bearer ${event.notification.data.access_token}`
          })
          await updateNotificationWithoutAction(event.notification, 'favourite')
          break
        }
        default: {
          await self.clients.openWindow(event.notification.data.url)
          await event.notification.close()
          break
        }
      }
    })()
  )
})

self.addEventListener('message', event => {
  switch (event.data) {
    case 'skip-waiting':
      self.skipWaiting()
      break
  }
})
