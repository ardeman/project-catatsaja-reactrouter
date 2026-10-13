// Draws every app icon from one vector master, scripts/icon/logo.svg:
//   pnpm generate:icons
// Run it after changing the master and commit what it writes to public/.
// The PNGs are drawn by Chrome through Playwright (already used by the
// end-to-end tests), so no image library is needed.

import { readFile, writeFile } from 'node:fs/promises'

import { chromium } from 'playwright'

const master = await readFile(new URL('icon/logo.svg', import.meta.url), 'utf8')
const publicFile = (name) => new URL(`../public/${name}`, import.meta.url)

// Rounded like an app tile, with clear corners: for the app itself, the
// favicon, link previews and Android's plain icons.
const rounded = master
  .replace(
    '<g id="tile">',
    '<clipPath id="round"><rect width="512" height="512" rx="112"/></clipPath>\n  <g clip-path="url(#round)">\n  <g id="tile">',
  )
  .replace(
    /<\/svg>\s*$/,
    '  <rect class="tile-edge" x="1" y="1" width="510" height="510" rx="111" fill="none" stroke-width="2"/>\n  </g>\n</svg>\n',
  )

// Full-bleed, the drawing shrunk into the middle 80%: Android crops
// maskable icons to its own shape (a circle at the smallest).
const maskable = master.replace(
  '<g id="art" transform="',
  '<g id="art" transform="translate(256 256) scale(0.8) translate(-256 -256) ',
)

// The light tile, shown on the app's dark theme (and the dark tile on the
// light one). Icons people install stay dark: they can't follow the theme.
const light = (svg) => svg.replace('<svg xmlns=', '<svg class="light" xmlns=')

// iOS rounds the corners itself, so its icon is the full-bleed tile.
const icons = [
  { name: 'apple-touch-icon.png', svg: master, size: 180 },
  { name: 'android-chrome-192x192.png', svg: rounded, size: 192 },
  { name: 'android-chrome-512x512.png', svg: rounded, size: 512 },
  { name: 'maskable-192x192.png', svg: maskable, size: 192 },
  { name: 'maskable-512x512.png', svg: maskable, size: 512 },
  { name: 'favicon-16x16.png', svg: rounded, size: 16 },
  { name: 'favicon-32x32.png', svg: rounded, size: 32 },
  { name: 'favicon-32x32-light.png', svg: light(rounded), size: 32 },
  { name: 'logo.png', svg: rounded, size: 800 },
]

const browser = await chromium.launch({ channel: 'chrome' })

// A page of the icon's own size for each (resizing one page left parts of
// the previous drawing in larger screenshots).
const draw = async (svg, size) => {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
  })
  const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}img{display:block}</style><img src="${source}" width="${size}" height="${size}">`,
  )
  await page.locator('img').evaluate((image) => image.decode())
  const png = await page.screenshot({ omitBackground: true })
  await page.close()
  return png
}

const drawn = new Map()
try {
  for (const { name, svg, size } of icons) {
    const png = await draw(svg, size)
    drawn.set(name, png)
    await writeFile(publicFile(name), png)
  }
} finally {
  await browser.close()
}

// favicon.ico: the 16 and 32 pixel PNGs in an icon directory.
const images = [
  [16, drawn.get('favicon-16x16.png')],
  [32, drawn.get('favicon-32x32.png')],
]
const header = Buffer.alloc(6 + 16 * images.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = header.length
for (const [index, [size, png]] of images.entries()) {
  const entry = 6 + 16 * index
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(png.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += png.length
}
await writeFile(
  publicFile('favicon.ico'),
  Buffer.concat([header, ...images.map(([, png]) => png)]),
)

await writeFile(publicFile('logo-dark.svg'), rounded)
await writeFile(publicFile('logo-light.svg'), light(rounded))
console.log(`Wrote ${icons.length + 3} icons to public/`)
