import { Appearance } from './appearance'
import { Profile } from './profile'

export const GeneralSettingsPage = () => {
  return (
    <div className="grid gap-6">
      <Profile />
      <Appearance />
    </div>
  )
}
