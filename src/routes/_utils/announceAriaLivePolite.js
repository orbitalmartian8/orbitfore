const ariaLiveElement = ENAFORE_IS_BROWSER && document.getElementById('theAriaLive')

export function announceAriaLivePolite (text) {
  ariaLiveElement.textContent = text
}
