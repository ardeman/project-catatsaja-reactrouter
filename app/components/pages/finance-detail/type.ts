import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceResponse,
} from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'

export type TFormProperties = {
  finance?: TFinanceResponse
}

export type TEntryFormProperties = {
  onClose: () => void
  // The entry being edited; a new one when undefined.
  entry?: TFinanceEntry
  book: TFinanceCurrency
  currencies: TCurrency[]
  // Past entries from every book, newest first, for category suggestions.
  history: TFinanceEntry[]
  // False when the book has no room for it: the form stays open.
  onSave: (entry: TFinanceEntry) => boolean
  onDelete: (id: string) => void
  // Where the unsaved new entry is kept (lib/utils/drafts); none, no draft.
  draftKey?: string
  // An encrypted book: the draft is kept for this tab only.
  isPrivate?: boolean
}

export type TReceiptScanProperties = {
  book: TFinanceCurrency
  currencies: TCurrency[]
  // Past entries from every book, newest first, for category suggestions.
  history: TFinanceEntry[]
  // False when the book has no room for them: they stay to try again.
  onAdd: (entries: TFinanceEntry[]) => boolean
  // Quick add's unsaved text (lib/utils/drafts); none, no draft.
  draftKey?: string
  isPrivate?: boolean
}
