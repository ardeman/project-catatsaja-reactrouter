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
  onSave: (entry: TFinanceEntry) => void
  onDelete: (id: string) => void
  // Shown at the top of the card while adding (the book's totals).
  summary?: React.ReactNode
}

export type TReceiptScanProperties = {
  book: TFinanceCurrency
  currencies: TCurrency[]
  // Past entries from every book, newest first, for category suggestions.
  history: TFinanceEntry[]
  onAdd: (entries: TFinanceEntry[]) => void
}
