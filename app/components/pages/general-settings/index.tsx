import { Appearance } from './appearance'
import { Photo } from './photo'
import { Profile } from './profile'

export const GeneralSettingsPage = () => {
  return (
    <div className="grid gap-6">
      <Photo />
      <Profile />
      <Appearance />
    </div>
  )
}
