import { writeFileSync } from 'node:fs'
import path from 'node:path'

import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

// Identifies this build. The app compares it with `/version.json` from the
// server to tell people a newer version has been deployed.
const buildId = process.env.GITHUB_SHA ?? String(Date.now())

const versionFile = (): Plugin => ({
  name: 'version-file',
  apply: 'build',
  applyToEnvironment: (environment) => environment.name === 'client',
  writeBundle({ dir: directory = 'build/client' }) {
    writeFileSync(
      path.join(directory, 'version.json'),
      JSON.stringify({ buildId }),
    )
  },
})

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), versionFile()],
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    // Milkdown uses Vue internally; keep Vue's default feature flags explicit.
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Shared icons and UI primitives otherwise become dozens of tiny
          // requests on public pages. Keep feature modules dynamically split.
          groups: [
            {
              name: 'icons',
              test: /node_modules[\\/]lucide-react[\\/]/,
            },
            {
              name: 'ui-primitives',
              test: /node_modules[\\/](@radix-ui|@floating-ui)[\\/]/,
            },
            {
              name: 'public-ui',
              test: /app[\\/]components[\\/](?:ui[\\/](?:button|card|dialog|dropdown-menu|label)\.tsx|base[\\/](?:card|category-bar|category-icon|health-status|sex-icon|loading-spinner|logo|modal|mode-toggle|language-selector|install-app|preview-card)[\\/])/,
            },
          ],
        },
      },
    },
  },
  // Development: scan every route at start-up, so all dependencies are
  // prepared before the first page loads. Otherwise opening a page that
  // uses a new one makes the dev server rebuild and reload mid-load (and a
  // first visit on a fresh checkout, as in CI, comes up empty).
  optimizeDeps: {
    entries: ['app/entry.client.tsx', 'app/root.tsx', 'app/routes/**/*.tsx'],
  },
})
