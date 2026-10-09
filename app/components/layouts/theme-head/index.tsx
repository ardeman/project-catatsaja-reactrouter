import { themeColors } from '~/lib/constants/metadata'

// Runs before the first paint: the installed app skips the landing page, and
// the saved theme and text size are applied so pages rendered at build time
// (the landing page) don't flash the wrong theme.
const themeScript = `(() => {
  try {
    // The installed app has no landing page: leave it before it paints.
    const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
    if (installed && location.pathname === '/') {
      location.replace('/notes')
      return
    }
    const theme = localStorage.getItem('vite-ui-theme') || 'system'
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.add(dark ? 'dark' : 'light')
    let color = document.querySelector('meta[name="theme-color"]')
    if (!color) {
      color = document.createElement('meta')
      color.name = 'theme-color'
      document.head.append(color)
    }
    color.content = dark ? '${themeColors.dark}' : '${themeColors.light}'
    const size = localStorage.getItem('tailwind-size')
    const sizes = { small: '87.5%', large: '112.5%' }
    if (sizes[size]) document.documentElement.style.setProperty('--base-size', sizes[size])
  } catch {}
})()`

// The browser and installed-app bars follow the app's theme (not only the
// device's) through one theme-color tag. The script creates it before the
// first paint and ThemeProvider updates it; React does not render it, because
// React would add its own copy once the script had changed it.
export const ThemeHead = () => (
  <script dangerouslySetInnerHTML={{ __html: themeScript }} />
)
