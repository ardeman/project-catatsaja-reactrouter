import { TStatus } from '~/lib/constants/health'
import {
  TBmiStandard,
  THealthDose,
  THealthEntry,
  THealthKind,
  THealthLogForm,
  THealthLogResponse,
  THealthMedication,
  THealthReminder,
  TLabUnits,
} from '~/lib/types/health'

export type TFormProperties = {
  healthLog?: THealthLogResponse
}

// What every section of a log gets.
export type TSectionProperties = {
  log: THealthLogForm
  isReadOnly: boolean
  units: TLabUnits
  bmiStandard: TBmiStandard
  onSaveEntry: (entry: THealthEntry) => void
  onDeleteEntry: (id: string) => void
  // A kind whose add form shows open ("Log now" on a reminder) until it
  // closes and `onAddClosed` clears it.
  addingKind?: THealthKind
  onAddClosed?: () => void
}

// A value in a comparison row (body history): aligned columns, with the
// change from the previous measurement under the number.
export type TEntryMetric = {
  key: string
  label: string
  // Formatted value; omitted when this entry has none for the column.
  value?: string
  // e.g. "+0.3 kg"; omitted when there is nothing to compare with.
  change?: string
  changeDirection?: 'up' | 'down' | 'flat'
}

// One row of an entry list. `primary` for a single line; `metrics` for
// columns that line up across rows so values are easy to compare.
export type TEntryRow = {
  primary?: string
  metrics?: TEntryMetric[]
  secondary?: string
  status?: TStatus
}

export type TRemindersProperties = {
  log: THealthLogForm
  // A fertile window reminder is the owner's (`isReminderFor`).
  isOwner: boolean
  isReadOnly: boolean
  // Period reminders only where period tracking shows.
  showPeriod: boolean
  onChange: (reminders: THealthReminder[]) => void
  // Opens the section to log a due measurement in, with its add form open.
  onOpen: (kind: THealthKind) => void
}

export type TMedicationsProperties = {
  log: THealthLogForm
  isReadOnly: boolean
  onChangeMedications: (medications: THealthMedication[]) => void
  onChangeDoses: (doses: THealthDose[]) => void
}

export type TMedicationFormProperties = {
  // The medicine being edited; a new one when undefined.
  medication?: THealthMedication
  onSave: (medication: THealthMedication) => void
  onClose: () => void
}
