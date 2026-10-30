// The screen guides: a short walk over a page's real controls. Each step
// names a `data-guide` marker on the page and its text in
// `guide.<guide>.<target>`. Steps whose control isn't on screen (a phone
// layout, read-only access, a Plus part) are left out when the guide starts.

export const screenGuides = {
  notes: ['create', 'search', 'account'],
  note: ['format', 'ai', 'undo', 'share', 'delete'],
  tasks: ['create', 'search', 'account'],
  task: ['add-item', 'check-all', 'ai', 'share'],
  finances: ['create', 'search', 'account'],
  finance: ['add-entry', 'quick-add', 'view', 'share'],
  health: ['create', 'search', 'account'],
  healthLog: ['sections', 'reminders', 'medications', 'share'],
  settings: ['settings-sections', 'account'],
} as const

export type TScreenGuide = keyof typeof screenGuides

// The guide each section of How to use can show in the app.
export const helpGuides: Partial<
  Record<string, { guide: TScreenGuide; href: string }>
> = {
  notes: { guide: 'notes', href: '/notes' },
  tasks: { guide: 'tasks', href: '/tasks' },
  finances: { guide: 'finances', href: '/finances' },
  health: { guide: 'health', href: '/health' },
  settings: { guide: 'settings', href: '/settings' },
}

const seenStorageKey = 'screen-guide-seen'

export const readSeenGuides = (): string[] => {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(seenStorageKey) ?? '[]',
    )
    return Array.isArray(saved) ? saved.map(String) : []
  } catch {
    return []
  }
}

const writeSeenGuides = (guides: string[]) => {
  try {
    localStorage.setItem(seenStorageKey, JSON.stringify(guides))
  } catch {
    // Storage blocked: the guide may show again on the next visit.
  }
}

export const rememberGuideSeen = (guide: TScreenGuide) => {
  const seen = readSeenGuides()
  if (!seen.includes(guide)) writeSeenGuides([...seen, guide])
}

// So the page shows its guide again when it opens.
export const forgetGuideSeen = (guide: TScreenGuide) => {
  writeSeenGuides(readSeenGuides().filter((item) => item !== guide))
}
