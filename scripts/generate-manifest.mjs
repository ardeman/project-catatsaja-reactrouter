import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Read metadata constants from the source file
const metadataPath = new URL(
  '../app/lib/constants/metadata.ts',
  import.meta.url,
)
const metadataSource = readFileSync(metadataPath, 'utf8')

const extract = (name, fallback) => {
  const match = metadataSource.match(
    new RegExp(`export const ${name} = ['\"]([^'\"]+)['\"]`),
  )
  return match?.[1] ?? fallback
}

const appName = extract('appName', 'App')
const appleIcon = extract('appleIcon', '/apple-touch-icon.png')
const shortcutIcon = extract('shortcutIcon', '/android-chrome-512x512.png')

const manifest = {
  name: appName,
  short_name: appName,
  icons: [
    { src: shortcutIcon, sizes: '512x512', type: 'image/png' },
    { src: appleIcon, sizes: '180x180', type: 'image/png' },
  ],
  theme_color: '#facc14',
  background_color: '#ffffff',
  display: 'standalone',
}

const outputPath = join(process.cwd(), 'public', 'site.webmanifest')
writeFileSync(outputPath, JSON.stringify(manifest))
console.log(`Generated ${outputPath}`)
