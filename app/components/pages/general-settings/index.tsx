import { Appearance } from './appearance'
import { Currency } from './currency'
import { Profile } from './profile'

export const GeneralSettingsPage = () => {
  return (
    <div className="grid gap-6">
      <Profile />
      <Appearance />
      <Currency />
    </div>
  )
}
