import { Appearance } from './appearance'
import { Navigation } from './navigation'
import { Profile } from './profile'

export const GeneralSettingsPage = () => {
  return (
    <div className="grid gap-6">
      <Profile />
      <Appearance />
      <Navigation />
    </div>
  )
}
