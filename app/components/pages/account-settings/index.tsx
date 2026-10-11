import { Ai } from './ai'
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
      </div>
    </AccountSettingsProvider>
  )
}
