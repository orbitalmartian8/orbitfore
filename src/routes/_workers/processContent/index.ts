import registerPromiseWorker from 'promise-worker/register.js'
import { statusDomToPlainText } from '../../_utils/statusHtmlToPlainText.ts'
import { computeHashtagBarForStatus } from './hashtagBar.ts'
import { renderMfm } from './mfm.ts'
import { renderPostHTMLToDOM } from '../../_utils/renderPostHTML.ts'
import type { Mention } from '../../_utils/types.ts'
import {
  type DefaultTreeAdapterMap,
  defaultTreeAdapter,
  html,
  serialize,
} from 'parse5'
const {
  NS: { HTML },
} = html

registerPromiseWorker(
  async ({ originalStatus, autoplayGifs, currentVerifyCredentials }) => {
    const mfmContent =
      originalStatus.content_type === 'text/x.misskeymarkdown'
        ? originalStatus.text
        : originalStatus.akkoma &&
            originalStatus.akkoma.source &&
            originalStatus.akkoma.source.mediaType === 'text/x.misskeymarkdown'
          ? originalStatus.akkoma.source.content
          : null
    let dom: DefaultTreeAdapterMap['parentNode'],
      hashtagsInBar: { display?: string; value: string }[]
    const userHost =
      currentVerifyCredentials && currentVerifyCredentials.fqn
        ? currentVerifyCredentials.fqn.split('@')[1]
        : new URL(currentVerifyCredentials.url).hostname
    const emojis = new Map<string, any>()
    if (originalStatus.emojis) {
      for (const emoji of originalStatus.emojis) {
        emojis.set(emoji.shortcode, emoji)
      }
    }
    const mentionsByURL: Map<string, Mention> = new Map()
    const mentionsByAcct: Map<string, Mention> = new Map()
    const mentionsByLowerAcct: Map<string, Mention> = new Map()
    if (originalStatus.mentions) {
      for (const mention of originalStatus.mentions as Mention[]) {
        mention.included = false
        mentionsByURL.set(mention.url, mention)
        mentionsByAcct.set(mention.acct, mention)
        mentionsByLowerAcct.set(mention.acct.toLowerCase(), mention)
      }
    }
    if (mfmContent) {
      dom = renderMfm({
        mfmContent,
        htmlContent: originalStatus.content,
        autoplayGifs,
        emojis,
        mentionsByURL,
        mentionsByAcct,
        mentionsByLowerAcct,
      })
    } else {
      dom = renderPostHTMLToDOM({
        content: originalStatus.content,
        tags: originalStatus.tags,
        autoplayGifs,
        emojis,
        mentionsByURL,
        mentionsByAcct,
        hasQuote: 'quote' in originalStatus,
      })
    }
    ;({ dom, hashtagsInBar } = computeHashtagBarForStatus(dom, originalStatus))
    if (originalStatus.mentions) {
      const extraMentions = originalStatus.mentions.filter(
        (mention: any) => !mention.included,
      )
      if (extraMentions.length) {
        let firstBlock = dom
        while (
          firstBlock.childNodes.length > 0 &&
          'tagName' in firstBlock.childNodes[0]! &&
          ['div', 'p'].includes(firstBlock.childNodes[0].tagName)
        ) {
          firstBlock = firstBlock.childNodes[0]
        }
        while (extraMentions.length) {
          const mention = extraMentions.pop()
          if (mention.id === originalStatus.account.id) {
            continue
          }
          const ele = defaultTreeAdapter.createElement('a', HTML, [
            {
              name: 'class',
              value: 'mention',
            },
            {
              name: 'href',
              value: '/accounts/' + mention.id,
            },
            {
              name: 'title',
              value: '@' + mention.acct,
            },
          ])
          defaultTreeAdapter.insertText(ele, '@' + mention.username)
          defaultTreeAdapter.insertTextBefore(
            firstBlock,
            ' ',
            firstBlock.childNodes[0]!,
          )
          defaultTreeAdapter.insertBefore(
            firstBlock,
            ele,
            firstBlock.childNodes[0]!,
          )
        }
      }
    }
    return {
      content: serialize(dom),
      hashtagsInBar,
      plainTextContent: statusDomToPlainText(dom, originalStatus.mentions),
    }
  },
)
