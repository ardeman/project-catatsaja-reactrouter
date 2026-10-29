import { CardColumns } from '~/components/base/card-columns'

import { Ai } from './ai'
import { Blocked } from './blocked'
import { AccountSettingsProvider } from './context'
import { Email } from './email'
import { Google } from './google'
import { Security } from './security'

export const AccountSettingsPage = () => {
  return (
    <AccountSettingsProvider>
      <CardColumns
        cards={[
          { key: 'email', column: 0, node: <Email /> },
          { key: 'google', column: 1, node: <Google /> },
          { key: 'security', column: 0, node: <Security /> },
          { key: 'ai', column: 1, node: <Ai /> },
          { key: 'blocked', column: 1, node: <Blocked /> },
        ]}
      />
    </AccountSettingsProvider>
  )
}
