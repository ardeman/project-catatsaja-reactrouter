import { AccountSettingsProvider } from './context'
import { Email } from './email'
import { Google } from './google'

export const AccountSettingsPage = () => {
  return (
    <AccountSettingsProvider>
      <div className="grid gap-6">
        <Email />
        <Google />
      </div>
    </AccountSettingsProvider>
  )
}
