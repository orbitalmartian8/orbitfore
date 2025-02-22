import { store } from '../_store/store.js'
import { search } from '../_api/search.js'

export async function checkStats () {
  const { currentInstance, accessToken } = store.get()
  const pingTime = Date.now()
  if (
    ENAFORE_IS_BROWSER &&
    pingTime -
      ((store.getInstanceData(currentInstance, 'lastPings') || 0) +
        Math.random() * 1000 * 60 * 60 * 12) >
      1000 * 60 * 60 * 24
  ) {
    store.setInstanceData(currentInstance, 'lastPings', pingTime)
    store.save()
    await search(
      currentInstance,
      accessToken,
      'https://stats.pinafore.easrng.net/ping/' +
        new URLSearchParams({
          n: Math.floor(pingTime / 1000 / 60 / 10),
          r: Math.floor(Math.random() * 1e17).toString(32),
          l: navigator.languages[
            Math.round(Math.random() * (navigator.languages.length - 1))
          ],
          v: ENAFORE_VERSION
        }),
      true,
      1,
      false
    )
  }
}
