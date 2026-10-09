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
    new RegExp(`export const ${name} =\\s*['\"]([^'\"]+)['\"]`),
  )
  return match?.[1] ?? fallback
}

const appName = extract('appName', 'App')
const description = extract('appDescription', '')
const themeColor = extract('themeColor', '#ffffff')

const manifest = {
  id: '/',
  name: appName,
  short_name: appName,
  description,
  lang: 'en',
  // Installed, the app opens on the notes list (signed-out people are sent
  // to sign in) instead of the landing page.
  start_url: '/notes',
  scope: '/',
  display: 'standalone',
  categories: ['productivity'],
  theme_color: themeColor,
  background_color: themeColor,
  icons: [
    {
      src: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  // Long-press the app icon (Android) or right-click it (desktop).
  shortcuts: [
    {
      name: 'New note',
      short_name: 'Note',
      url: '/notes/create',
      icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
    },
    {
      name: 'New task',
      short_name: 'Task',
      url: '/tasks/create',
      icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
    },
  ],
}

const outputPath = join(process.cwd(), 'public', 'site.webmanifest')
writeFileSync(outputPath, JSON.stringify(manifest))
console.log(`Generated ${outputPath}`)
