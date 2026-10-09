export const protectedPages = new Set([
  '/notes',
  '/tasks',
  '/finances',
  '/settings',
])

export const authPages = new Set(['/', '/auth'])

// Pages that don't depend on the signed-in user, so they render without
// waiting for Firebase Auth (the landing page is also rendered at build time).
export const publicPages = new Set(['/', '/about', '/privacy', '/terms'])
