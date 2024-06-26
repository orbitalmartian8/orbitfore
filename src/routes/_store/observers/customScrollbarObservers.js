import { store } from '../store.js'

const theScrollbarStyle = process.env.BROWSER && document.getElementById('theScrollbarStyle')

export function customScrollbarObservers () {
  store.observe('disableCustomScrollbars', disableCustomScrollbars => {
    if (!process.env.BROWSER) {
      return
    }

    // disables or enables the style
    theScrollbarStyle.setAttribute('media', disableCustomScrollbars ? 'only x' : 'all')
  }, { init: false }) // init:false because the inline script takes care of it
}
