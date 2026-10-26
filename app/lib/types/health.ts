import {
  TCardStyle,
  TAccessLists,
  THandleSetPermission,
  TPermissions,
  TTime,
} from './common'

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
  // Sex on that day, with protection or not. Logged on the period calendar.
  | (TEntryBase & { kind: 'intimacy'; protected: boolean })

export type THealthKind = THealthEntry['kind']

export type THealthEntryOf<TKind extends THealthKind> = Extract<
  THealthEntry,
  { kind: TKind }
>

// A reminder to log a measurement every few days (at a time, or any time
// that day), that a period is expected in a few days, or that the fertile
// window starts in a few days (for the owner only, unless `shared`). Shown
// when due and sent as a push notification.
export type THealthReminder =
  | {
      id: string
      kind: Exclude<THealthKind, 'period' | 'intimacy'>
      everyDays: number
      time?: string
    }
  | { id: string; kind: 'period'; daysBefore: number }
  | { id: string; kind: 'fertile'; daysBefore: number; shared?: boolean }

// How long a medicine is taken: until a date, for a number of days or of
// doses (skipped ones don't count), or with no end.
export type TMedicationCourse =
  | { kind: 'ongoing' }
  | { kind: 'until'; date: string }
  | { kind: 'days'; days: number }
  | { kind: 'doses'; doses: number }

// A medicine taken at one or more times a day, every few days, from
// `start` for its course.
export type THealthMedication = {
  id: string
  name: string
  // As the person writes it ("500 mg", "1 tablet").
  dose?: string
  note?: string
  // HH:MM
  times: string[]
  everyDays: number
  start: string
  course: TMedicationCourse
  // The last day, when stopped before the course ends.
  stopped?: string
}

// A dose marked taken or skipped; its id comes from the medicine, day and
// time (`doseId`), so there is one per dose.
export type THealthDose = {
  id: string
  medicationId: string
  date: string
  time: string
  status: 'taken' | 'skipped'
}

// A health log: one person (the owner, a child, a parent) and their
// measurements.
export type THealthLogForm = {
  name: string
  birthDate: string
  sex: THealthSex
  // kcal a day; null until set.
  calorieTarget: number | null
  content: THealthEntry[]
  // Missing on logs made before reminders.
  reminders?: THealthReminder[]
  // Missing on logs made before medicines.
  medications?: THealthMedication[]
  doseLog?: THealthDose[]
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
  // Stored end-to-end encrypted (set when read, never saved).
  isEncrypted?: boolean
  cardStyle?: TCardStyle
  pinnedBy?: string[]
  // Archived by the person (their own list only).
  isArchived?: boolean
  archivedBy?: string[]
  createdAt: TTime
  updatedAt?: TTime
  owner: string
  permissions?: TPermissions
  // People invited who haven't accepted yet.
  invites?: TAccessLists
} & THealthLogForm

export type THealthLogPermissionRequest = THandleSetPermission & {
  healthLog: THealthLogResponse
}

// Settings (on the person's profile).
export type TBmiStandard = 'kemenkes' | 'who' | 'asiaPacific'

export type TLabUnits = 'conventional' | 'si'
