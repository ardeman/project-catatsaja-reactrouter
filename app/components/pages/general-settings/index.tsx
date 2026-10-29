import { CardColumns } from '~/components/base/card-columns'

import { Appearance } from './appearance'
import { DateFormat } from './date-format'
import { Navigation } from './navigation'
import { Profile } from './profile'
import { Push } from './push'

export const GeneralSettingsPage = () => {
  return (
    <CardColumns
      cards={[
        { key: 'profile', column: 0, node: <Profile /> },
        { key: 'appearance', column: 1, node: <Appearance /> },
        { key: 'date-format', column: 0, node: <DateFormat /> },
        { key: 'navigation', column: 1, node: <Navigation /> },
        { key: 'push', column: 0, node: <Push /> },
      ]}
    />
  )
}
