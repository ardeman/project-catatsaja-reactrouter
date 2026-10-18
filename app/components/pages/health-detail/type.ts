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
}

// One row of an entry list.
export type TEntryRow = {
  primary: string
  secondary?: string
  status?: TStatus
}

export type TRemindersProperties = {
  log: THealthLogForm
  isReadOnly: boolean
  // Period reminders only where period tracking shows.
  showPeriod: boolean
  onChange: (reminders: THealthReminder[]) => void
  // Opens the section to log a due measurement in.
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
