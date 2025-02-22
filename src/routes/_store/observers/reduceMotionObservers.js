export function reduceMotionObservers (store) {
  if (!ENAFORE_IS_BROWSER) {
    return
  }

  store.observe('reduceMotion', reduceMotion => {
    document.body.classList.toggle('reduce-motion', reduceMotion)
  })
}
