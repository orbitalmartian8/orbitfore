export function pageVisibilityObservers (store) {
  if (!ENAFORE_IS_BROWSER) {
    return
  }

  document.addEventListener('visibilitychange', () => {
    store.set({ pageVisibilityHidden: document.hidden })
  })
}
