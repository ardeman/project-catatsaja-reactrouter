// What push notifications say, in the language each device was filed with.
// The same words as the invitations in the app
// (`app/localization/locales/*/common.json`, `invitations`).

export type TLang = 'en' | 'id'

export type TKind = 'notes' | 'tasks' | 'finances' | 'healthLogs'

const kinds: Record<
  TLang,
  Record<TKind, { titled: string; untitled: string }>
> = {
  en: {
    notes: { titled: 'the note “{title}”', untitled: 'a note' },
    tasks: { titled: 'the list “{title}”', untitled: 'a task list' },
    finances: { titled: 'the book “{title}”', untitled: 'a finance book' },
    healthLogs: {
      titled: 'the health log “{title}”',
      untitled: 'a health log',
    },
  },
  id: {
    notes: { titled: 'catatan “{title}”', untitled: 'sebuah catatan' },
    tasks: { titled: 'daftar “{title}”', untitled: 'sebuah daftar tugas' },
    finances: { titled: 'buku “{title}”', untitled: 'sebuah buku keuangan' },
    healthLogs: {
      titled: 'log kesehatan “{title}”',
      untitled: 'sebuah log kesehatan',
    },
  },
}

const invitation = {
  en: {
    title: 'Invitation',
    message: '{name} shared {item} with you.',
    someone: 'Someone',
  },
  id: {
    title: 'Undangan',
    message: '{name} membagikan {item} denganmu.',
    someone: 'Seseorang',
  },
}

// `body` names only the kind; `detailed` has a `{title}` the device fills
// in from the sealed title, unless it hides details.
export const invitationText = (lang: TLang, kind: TKind, name?: string) => {
  const words = invitation[lang]
  // Without braces, a name can't be taken for a placeholder.
  const sender = name?.replaceAll(/[{}]/g, '').trim() || words.someone
  const message = words.message.replace('{name}', () => sender)
  return {
    title: words.title,
    body: message.replace('{item}', () => kinds[lang][kind].untitled),
    detailed: message.replace('{item}', () => kinds[lang][kind].titled),
  }
}
