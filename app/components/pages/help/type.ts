export const helpSections = [
  'start',
  'notes',
  'tasks',
  'finances',
  'health',
  'search',
  'sharing',
  'encryption',
  'gemini',
  'settings',
] as const

export type THelpSection = (typeof helpSections)[number]
