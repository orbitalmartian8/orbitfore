import { get } from '../../_utils/lodash-lite.js'

export function badgeComputations (store) {
  store.compute('numberOfNotifications',
    ['filteredTimelineNotificationItemSummaries', 'disableNotificationBadge'],
    (filteredTimelineNotificationItemSummaries, disableNotificationBadge) => (
      (!disableNotificationBadge && filteredTimelineNotificationItemSummaries)
        ? filteredTimelineNotificationItemSummaries.length
        : 0
    )
  )
  store.compute('hasNotifications',
    ['numberOfNotifications', 'currentPage'],
    (numberOfNotifications, currentPage) => (
      currentPage !== 'notifications' && !!numberOfNotifications
    )
  )

  store.compute('numberOfFollowRequests',
    ['followRequestCounts', 'currentInstance', 'disableFollowRequestCount'],
    (followRequestCounts, currentInstance, disableFollowRequestCount) => disableFollowRequestCount ? 0 : get(followRequestCounts, [currentInstance], 0)
  )

  store.compute('hasFollowRequests',
    ['numberOfFollowRequests'],
    (numberOfFollowRequests) => !!numberOfFollowRequests
  )

  store.compute('badgeNumber',
    ['numberOfFollowRequests', 'numberOfNotifications'],
    (numberOfFollowRequests, numberOfNotifications) => (numberOfFollowRequests + numberOfNotifications)
  )
}
