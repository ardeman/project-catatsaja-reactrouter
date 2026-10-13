import { TTime } from './common'

// `config/app`, set from the Firebase console (README → Deployment).
export type TAppConfig = {
  // Shows the maintenance screen instead of the app while true.
  maintenance?: boolean
  // Shown on that screen, in addition to the standard text.
  message?: string
  // When it is expected to end.
  until?: TTime
  // Apps whose `appVersion` is lower are asked to reload.
  minAppVersion?: number
}
