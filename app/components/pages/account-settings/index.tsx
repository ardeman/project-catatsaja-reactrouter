import { Ai } from './ai'
import { Blocked } from './blocked'
import { AccountSettingsProvider } from './context'
import { Email } from './email'
import { Google } from './google'
import { Security } from './security'

export const AccountSettingsPage = () => {
  return (
    <AccountSettingsProvider>
      <div className="grid gap-6">
        <Email />
        <Google />
        <Security />
        <Ai />
        <Blocked />
      </div>
    </AccountSettingsProvider>
  )
}
