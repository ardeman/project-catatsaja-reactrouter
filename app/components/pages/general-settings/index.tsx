import { Appearance } from './appearance'
import { DateFormat } from './date-format'
import { Navigation } from './navigation'
import { Profile } from './profile'
import { Push } from './push'

export const GeneralSettingsPage = () => {
  return (
    <div className="grid gap-6">
      <Profile />
      <Appearance />
      <DateFormat />
      <Navigation />
      <Push />
    </div>
  )
}
