import { observers } from './observers/observers.js'
import { computations } from './computations/computations.js'
import { mixins } from './mixins/mixins.js'
import { LocalStorageStore } from './LocalStorageStore.js'
import { observe } from 'svelte-extras'
import { isKaiOS } from '../_utils/userAgent/isKaiOS.js'

const persistedState = {
  alwaysShowFocusRing: false,
  autoplayGifs: !(
    !ENAFORE_IS_BROWSER || matchMedia('(prefers-reduced-motion: reduce)').matches
  ),
  composeData: {},
  currentInstance: null,
  currentRegisteredInstanceName: undefined,
  currentRegisteredInstance: undefined,
  // we disable scrollbars by default on iOS
  disableCustomScrollbars:
    ENAFORE_IS_BROWSER && /iP(?:hone|ad|od)/.test(navigator.userAgent),
  bottomNav: false,
  centerNav: false,
  disableFollowRequestCount: false,
  hideLongPosts: true,
  disableFavCounts: false,
  disableFollowerCounts: false,
  disableHotkeys: false,
  disableInfiniteScroll: false,
  disableLongAriaLabels: false,
  disableNotificationBadge: false,
  disableNotificationSound: (() => {
    try {
      return localStorage.getItem('store_disableNotificationBadge') === 'true'
    } catch (e) {
      return false
    }
  })(),
  disableReblogCounts: false,
  disableRelativeTimestamps: false,
  disableTapOnStatus: false,
  enableGrayscale: false,
  hideCards: false,
  leftRightChangesFocus: isKaiOS(),
  instanceNameInSearch: '',
  instanceThemes: {},
  instanceSettings: {},
  loggedInInstances: {},
  loggedInInstancesInOrder: [],
  markMediaAsSensitive: false,
  showAllSpoilers: false,
  neverMarkMediaAsSensitive: false,
  ignoreBlurhash: false,
  omitEmojiInDisplayNames: undefined,
  pinnedPages: {},
  pushSubscriptions: {},
  lastPings: {},
  reduceMotion:
    !ENAFORE_IS_BROWSER || matchMedia('(prefers-reduced-motion: reduce)').matches,
  underlineLinks: false,
  iconColors: '',
  lastContentTypes: {}
}

const nonPersistedState = {
  customEmoji: {},
  unexpiredInstanceFilters: {},
  followRequestCounts: {},
  instanceInfos: {},
  instanceLists: {},
  instanceFilters: {},
  online: !ENAFORE_IS_BROWSER || navigator.onLine,
  pinnedStatuses: {},
  polls: {},
  pushNotificationsSupport:
    ENAFORE_IS_BROWSER &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'getKey' in PushSubscription.prototype,
  queryInSearch: '',
  repliesShown: {},
  sensitivesShown: {},
  spoilersShown: {},
  statusModifications: {},
  verifyCredentials: {},
  statusTranslationContents: {},
  statusTranslations: {},
  instanceDataReady: {}
}

const state = Object.assign({}, persistedState, nonPersistedState)
export const keysToStoreInLocalStorage = new Set(Object.keys(persistedState))

export class PinaforeStore extends LocalStorageStore {
  constructor (state) {
    super(state, keysToStoreInLocalStorage)
  }
}

PinaforeStore.prototype.observe = observe

export const store = new PinaforeStore(state)

mixins(PinaforeStore)
computations(store)
observers(store)

if (ENAFORE_IS_BROWSER) {
  window.__store = store // for debugging
}
