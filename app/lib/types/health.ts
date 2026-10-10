import { THandleSetPermission, TPermissions, TTime } from './common'

export type THealthSex = 'male' | 'female'

export type TGlucoseContext =
  'fasting' | 'beforeMeal' | 'afterMeal' | 'random' | 'bedtime'

type TMeal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

type TFlow = 'light' | 'medium' | 'heavy'

// Lab values are stored in mg/dL whatever unit the person reads them in.
type TEntryBase = {
  id: string
  // YYYY-MM-DD, and HH:MM when the time matters (glucose, meals).
  date: string
  time?: string
  note?: string
}

export type THealthEntry =
  | (TEntryBase & {
      kind: 'body'
      // kg, cm, cm (head circumference, for young children).
      weight?: number
      height?: number
      head?: number
    })
  | (TEntryBase & {
      kind: 'glucose'
      value: number
      context: TGlucoseContext
    })
  | (TEntryBase & { kind: 'uricAcid'; value: number })
  | (TEntryBase & {
      kind: 'cholesterol'
      total?: number
      ldl?: number
      hdl?: number
      triglycerides?: number
    })
  | (TEntryBase & { kind: 'calories'; kcal: number; meal: TMeal })
  | (TEntryBase & {
      // `date` is the first day; `end` the last, once known.
      kind: 'period'
      end?: string
      flow?: TFlow
    })

export type THealthKind = THealthEntry['kind']

export type THealthEntryOf<TKind extends THealthKind> = Extract<
  THealthEntry,
  { kind: TKind }
>

// A health log: one person (the owner, a child, a parent) and their
// measurements.
export type THealthLogForm = {
  name: string
  birthDate: string
  sex: THealthSex
  // kcal a day; null until set.
  calorieTarget: number | null
  content: THealthEntry[]
}

export type TCreateHealthLogRequest = THealthLogForm

export type TUpdateHealthLogRequest = { id: string } & Partial<THealthLogForm>

export type TPinHealthLogRequest = {
  healthLog: THealthLogResponse
  isPinned: boolean
}

export type THealthLogResponse = {
  id: string
  isPinned?: boolean
  pinnedBy?: string[]
  createdAt: TTime
  updatedAt?: TTime
  owner: string
  permissions?: TPermissions
} & THealthLogForm

export type THealthLogPermissionRequest = THandleSetPermission & {
  healthLog: THealthLogResponse
}

// Settings (on the person's profile).
export type TBmiStandard = 'kemenkes' | 'who' | 'asiaPacific'

export type TLabUnits = 'conventional' | 'si'
