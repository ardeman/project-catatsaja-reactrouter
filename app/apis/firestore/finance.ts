import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  QueryDocumentSnapshot,
  runTransaction,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'
import { TLiveSubscription } from '~/lib/types/common'
import {
  TCreateFinanceRequest,
  TFinanceEntry,
  TFinanceResponse,
  TPinFinanceRequest,
  TFinancePermissionRequest,
  TUpdateFinanceRequest,
} from '~/lib/types/finance'
import {
  contentKeyOf,
  decodeDocument,
  encodeChanges,
} from '~/lib/utils/encrypted-document'
import { bookSummary } from '~/lib/utils/finance-analysis'
import {
  decodeMonth,
  encodeMonth,
  entriesOfMonths,
  groupByMonth,
  TMonth,
} from '~/lib/utils/finance-months'
import { isSameJson } from '~/lib/utils/merge-stored'

import {
  createShared,
  readMonths,
  setSharedPermission,
  subscribeShared,
  subscribeSharedOne,
  unlinkShared,
  updateShared,
} from './shared-document'

// A book's entries are in its months once moved (`entryStore` 2,
// `finance-months.ts`), or in the book itself (`content`) before. The app
// sees `content` either way. Whenever entries are written, the book's
// summary (what lists and search show) is written with them.

// The months of each open book as last read, to write only the ones that
// changed: month → its document id and entries.
const storedMonths = new Map<
  string,
  Map<string, { id: string; content: TFinanceEntry[] }>
>()

const requireFirestore = () => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('No user is currently signed in.')
  return { database: firestore, uid }
}

// New books keep their entries in months from the start.
export const createFinance = (data: TCreateFinanceRequest) => {
  const {
    content = [],
    entryStore: _entryStore,
    ...book
  } = data as TCreateFinanceRequest & { entryStore?: number }
  return createShared(
    'finances',
    { ...book, entryStore: 2, summary: bookSummary(content) },
    async (batch, reference, contentKey) => {
      for (const [month, entries] of groupByMonth(content)) {
        const encoded = await encodeMonth(month, entries, contentKey)
        batch.set(doc(reference, 'months', encoded.id), encoded.data)
      }
    },
  )
}

export const updateFinance = (data: TUpdateFinanceRequest) => {
  const { id, content, ...rest } = data
  const months = storedMonths.get(id)
  if (!content) return updateShared('finances', id, rest)
  if (!months)
    return updateShared('finances', id, {
      ...rest,
      content,
      summary: bookSummary(content),
    })
  // Only the months whose entries changed are written, with the book.
  return updateShared(
    'finances',
    id,
    { ...rest, summary: bookSummary(content) },
    async (batch, reference, contentKey) => {
      const next = groupByMonth(content)
      for (const [month, entries] of next) {
        const stored = months.get(month)
        if (stored && isSameJson(entries, stored.content)) continue
        const encoded = await encodeMonth(month, entries, contentKey)
        batch.set(doc(reference, 'months', encoded.id), encoded.data)
      }
      for (const [month, stored] of months)
        if (!next.has(month)) batch.delete(doc(reference, 'months', stored.id))
    },
  )
}

// Moving a book's entries out of the book document into months, once, by
// someone who can change it, when they open it online. A transaction, so
// two devices can't both move it; doesn't touch `updatedAt`: it isn't an
// edit.
export const moveFinanceEntries = async (id: string) => {
  const { database, uid } = requireFirestore()
  const reference = doc(database, 'finances', id)
  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference)
    const raw = snapshot.data()
    if (!raw || raw.entryStore === 2) return
    const book = await decodeDocument('finances', id, raw, uid)
    if (!book) return
    const content = (book.content as TFinanceEntry[] | undefined) ?? []
    const contentKey = contentKeyOf('finances', id)
    const encoded = await encodeChanges(
      'finances',
      id,
      { summary: bookSummary(content) },
      ['content'],
    )
    transaction.update(reference, {
      ...encoded,
      ...(!contentKey && { content: deleteField() }),
      entryStore: 2,
    })
    for (const [month, entries] of groupByMonth(content)) {
      const month_ = await encodeMonth(month, entries, contentKey)
      transaction.set(doc(reference, 'months', month_.id), month_.data)
    }
  })
}

// A book with all its entries, read when they aren't at hand (deleting or
// copying from the list, which has only summaries).
export const withEntries = async (
  finance: TFinanceResponse,
): Promise<TFinanceResponse> => {
  if (finance.entryStore !== 2) return finance
  const { database } = requireFirestore()
  const months = await readMonths(
    doc(database, 'finances', finance.id),
    contentKeyOf('finances', finance.id),
  )
  return { ...finance, content: entriesOfMonths(months) }
}

export const pinFinance = async (data: TPinFinanceRequest) => {
  const { finance, isPinned } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const pinnedBy = new Set(finance.pinnedBy || [])
  if (isPinned) {
    pinnedBy.add(auth.currentUser.uid)
  } else {
    pinnedBy.delete(auth.currentUser.uid)
  }

  const reference = doc(firestore, 'finances', finance.id)
  return await updateDoc(reference, {
    pinnedBy: [...pinnedBy],
  })
}

// Its months go first, in the same batch: the rules check them against the
// book. Returns the book with its entries, so deleting can be undone.
export const deleteFinance = async (finance: TFinanceResponse) => {
  const { database } = requireFirestore()
  const reference = doc(database, 'finances', finance.id)
  const months =
    finance.entryStore === 2
      ? await readMonths(reference, contentKeyOf('finances', finance.id))
      : []
  const batch = writeBatch(database)
  for (const month of months) batch.delete(month.reference)
  batch.delete(reference)
  await batch.commit()
  storedMonths.delete(finance.id)
  return finance.entryStore === 2
    ? { ...finance, content: entriesOfMonths(months) }
    : finance
}

export const unlinkFinance = (finance: TFinanceResponse) =>
  unlinkShared('finances', finance)

export const setFinancePermission = (form: TFinancePermissionRequest) =>
  setSharedPermission('finances', form.finance, form.uid, form.permission, {
    allowPlain: form.allowPlain,
  })

export const subscribeToFinances: TLiveSubscription<TFinanceResponse[]> = (
  uid,
  onData,
  onError,
) => subscribeShared<TFinanceResponse>('finances', uid, onData, onError)

// One book, with its entries from its months once moved. Passed on only
// when every month can be read with the book's current key: while a new key
// is being written (someone removed), the book waits rather than showing
// part of its entries.
export const subscribeToFinance = (
  id: string,
  uid: string,
  onData: (data: TFinanceResponse | undefined) => void,
  onError: (error: unknown) => void,
) => {
  const { database } = requireFirestore()
  let book: TFinanceResponse | undefined
  let hasBook = false
  let months: QueryDocumentSnapshot[] | undefined
  let stopMonths: (() => void) | undefined
  let latest = 0
  const send = async () => {
    // Newer snapshots replace one still being decrypted.
    latest += 1
    if (!hasBook) return
    if (book?.entryStore !== 2) {
      storedMonths.delete(id)
      onData(book)
      return
    }
    if (!months) return
    const run = latest
    const contentKey = contentKeyOf('finances', id)
    const decoded = await Promise.all(
      months.map((month) =>
        decodeMonth(month.ref.path, month.data(), contentKey),
      ),
    )
    if (run !== latest || !book || decoded.some((month) => !month)) return
    const read = decoded as TMonth[]
    storedMonths.set(
      id,
      new Map(
        read.map((month, index) => [
          month.month,
          { id: months![index].id, content: month.content },
        ]),
      ),
    )
    onData({ ...book, content: entriesOfMonths(read) })
  }
  const stopBook = subscribeSharedOne<TFinanceResponse>(
    'finances',
    id,
    uid,
    (item) => {
      book = item
      hasBook = true
      if (!stopMonths && item?.entryStore === 2)
        stopMonths = onSnapshot(
          collection(database, 'finances', id, 'months'),
          (snap) => {
            months = snap.docs
            void send()
          },
          onError,
        )
      void send()
    },
    onError,
  )
  // The months stay known after the page closes: leaving a book saves it
  // once more, after its listener has stopped.
  return () => {
    stopBook()
    stopMonths?.()
  }
}
