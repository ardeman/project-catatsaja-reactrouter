import { Appearance } from './appearance'
import { Health } from './health'
import { Navigation } from './navigation'
import { Profile } from './profile'
import { Security } from './security'

export const GeneralSettingsPage = () => {
  return (
    <div className="grid gap-6">
      <Profile />
      <Appearance />
      <Navigation />
      <Health />
      <Security />
    </div>
  )
}
