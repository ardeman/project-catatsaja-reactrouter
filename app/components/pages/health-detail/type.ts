import { TStatus } from '~/lib/constants/health'
import {
  TBmiStandard,
  THealthEntry,
  THealthLogForm,
  THealthLogResponse,
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
