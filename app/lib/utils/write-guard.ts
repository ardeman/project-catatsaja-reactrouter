// A write is lost if the tab closes while it is still being prepared
// (encrypting, reading keys or months): Firestore keeps a write only once it
// is committed, and then uploads it later even after a reload. So the
// browser asks before the tab closes until every write in preparation is
// committed, not until the server confirms it, which never happens offline.
const preparing = new Set<symbol>()

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault()
}

export const whilePreparingWrite = async <T>(
  prepare: () => Promise<T>,
): Promise<T> => {
  const write = Symbol('write')
  if (preparing.size === 0) addEventListener('beforeunload', handleBeforeUnload)
  preparing.add(write)
  try {
    return await prepare()
  } finally {
    preparing.delete(write)
    if (preparing.size === 0)
      removeEventListener('beforeunload', handleBeforeUnload)
  }
}
