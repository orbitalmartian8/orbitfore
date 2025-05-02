import { formatIntl } from '../_utils/formatIntl.js'
import { emojifyText } from '../_utils/emojifyText.js'

interface NotificationInfo {
  actionText: string
  icon: string | null
  standalone: boolean
  ariaLabel: string
}

let reaction: (_: any) => NotificationInfo
export const notificationInfos = {
  reblog: ({ name }) => ({
    actionText: 'intl.rebloggedYou',
    icon: '#fa-retweet',
    standalone: false,
    ariaLabel: `${name} ${'intl.rebloggedYou'}`,
  }),
  favourite: ({ name }) => ({
    actionText: 'intl.favoritedYou',
    icon: '#fa-star',
    standalone: false,
    ariaLabel: `${name} ${'intl.favoritedYou'}`,
  }),
  reaction: (reaction = ({ notification, $autoplayGifs, name }) => {
    const shortcode = notification.emoji_reaction
      ? notification.emoji_reaction.name
      : notification.emoji_url && notification.emoji.replace(/:/g, '')
    const customEmoji = notification.emoji_reaction
      ? notification.emoji_reaction.url
      : notification.emoji_url
    const emoji = customEmoji
      ? ':' + shortcode + ':'
      : notification.emoji_reaction
        ? notification.emoji_reaction.name
        : notification.emoji
    const html = emojifyText(
      emoji,
      customEmoji
        ? [
            {
              url: notification.emoji_reaction
                ? notification.emoji_reaction.url
                : notification.emoji_url,
              static_url: notification.emoji_reaction
                ? notification.emoji_reaction.static_url
                : notification.emoji_url,
              shortcode,
            },
          ]
        : [],
      $autoplayGifs,
    )
    return {
      actionText: 'intl.reacted',
      icon: null,
      standalone: false,
      reaction: true,
      html,
      ariaLabel: `${name} ${'intl.reactedWith'} ${emoji}`,
    }
  }),
  emoji_reaction: reaction,
  'pleroma:emoji_reaction': reaction,
  'admin.sign_up': ({ name }) => ({
    actionText: 'intl.signedUp',
    icon: '#fa-user-plus',
    standalone: true,
    ariaLabel: `${name} ${'intl.signedUp'}`,
  }),
  follow: ({ name }) => ({
    actionText: 'intl.followedYou',
    icon: '#fa-user-plus',
    standalone: true,
    ariaLabel: `${name} ${'intl.followedYou'}`,
  }),
  status: null,
  mention: null,
  poll: ({ status, $currentVerifyCredentials }) =>
    $currentVerifyCredentials.id === status.account.id
      ? {
          actionText: 'intl.pollYouCreatedEnded',
          icon: '#fa-bar-chart',
          standalone: false,
          poll: true,
          ariaLabel: 'intl.pollYouCreatedEnded',
        }
      : {
          actionText: 'intl.pollYouVotedEnded',
          icon: '#fa-bar-chart',
          standalone: false,
          poll: true,
          ariaLabel: 'intl.pollYouVotedEnded',
        },
  update: ({ name }) => ({
    actionText: 'intl.edited',
    icon: '#fa-pencil',
    standalone: false,
    ariaLabel: `${name} ${'intl.edited'}`,
  }),
  follow_request: ({ name }) => ({
    actionText: 'intl.requestedFollow',
    icon: '#fa-hourglass',
    standalone: true,
    ariaLabel: `${name} ${'intl.requestedFollow'}`,
  }),
  'admin.report': ({ name }) => ({
    actionText: 'intl.reported',
    icon: '#fa-flag',
    standalone: false,
    ariaLabel: `${name} ${'admin.report'}`,
  }),
  move: ({ notification, name }) => ({
    actionText: 'intl.moved',
    icon: '#fa-arrow-right',
    standalone: true,
    move: true,
    target: notification.target,
    ariaLabel: `${name} ${'intl.moved'} ${'@' + notification.target.acct}`,
  }),
  bite: ({ notification, name }) => ({
    actionText: 'intl.bite',
    icon: '#tooth',
    standalone: true,
    target: notification.target,
    ariaLabel: `${name} ${'intl.bite'}`,
  }),
} as const satisfies Record<string, null | ((_: any) => NotificationInfo)>
export const unhandled: (_: any) => NotificationInfo = ({ notification }) => {
  const text = formatIntl('intl.unhandledNotification', {
    type: notification.type,
  })
  return {
    actionText: text,
    icon: '#fa-question',
    standalone: true,
    unhandled: true,
    ariaLabel: text,
  }
}
export const notMentions = Object.keys(notificationInfos).filter(
  (e) => e !== 'mention',
)
