import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // Development: scan every route at start-up, so all dependencies are
  // prepared before the first page loads. Otherwise opening a page that
  // uses a new one makes the dev server rebuild and reload mid-load (and a
  // first visit on a fresh checkout, as in CI, comes up empty).
  optimizeDeps: {
    entries: ['app/entry.client.tsx', 'app/root.tsx', 'app/routes/**/*.tsx'],
  },
})
