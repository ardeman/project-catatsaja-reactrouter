// Where to allow notifications again after refusing them: the steps differ
// by browser, and for the installed app they are in the app's own settings
// (the phone's, or the app window's menu) rather than the address bar.

export type TBlockedHelp =
  | 'iosApp'
  | 'androidApp'
  | 'androidTab'
  | 'samsung'
  | 'firefoxAndroid'
  | 'chromiumApp'
  | 'chromiumTab'
  | 'edgeApp'
  | 'edgeTab'
  | 'firefox'
  | 'safariMac'
  | 'safariMacApp'
  | 'other'

// The browser's name, for steps that read the same in Chromium browsers.
const chromiumName = (agent: string) => {
  if (/opr\//i.test(agent)) return 'Opera'
  if ('brave' in navigator) return 'Brave'
  return /chromium/i.test(agent) ? 'Chromium' : 'Chrome'
}

export const blockedHelp = (
  isStandalone: boolean,
): { kind: TBlockedHelp; browser: string } => {
  const agent = navigator.userAgent
  // iPadOS reports itself as a Mac.
  const isAppleMobile =
    /iphone|ipad|ipod/i.test(agent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isEdge = /edg(e|a|ios)?\//i.test(agent)
  const isFirefox = /firefox|fxios/i.test(agent)
  const isChromium = /chrome|chromium|crios/i.test(agent)
  const name = isEdge ? 'Edge' : chromiumName(agent)
  const help = (kind: TBlockedHelp, browser = name) => ({ kind, browser })
  // Push works only in the installed app there.
  if (isAppleMobile) return help('iosApp', 'Safari')
  if (/android/i.test(agent)) {
    if (/samsungbrowser/i.test(agent))
      return help('samsung', 'Samsung Internet')
    if (isFirefox) return help('firefoxAndroid', 'Firefox')
    return help(isStandalone ? 'androidApp' : 'androidTab')
  }
  if (isEdge) return help(isStandalone ? 'edgeApp' : 'edgeTab')
  if (isFirefox) return help('firefox', 'Firefox')
  if (isChromium) return help(isStandalone ? 'chromiumApp' : 'chromiumTab')
  if (/macintosh/i.test(agent) && /safari/i.test(agent))
    return help(isStandalone ? 'safariMacApp' : 'safariMac', 'Safari')
  return help('other', '')
}
