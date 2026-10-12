import { MetaFunction } from 'react-router'

import { HelpPage } from '~/components/pages/help'
import { appName, withAppMeta } from '~/lib/constants/metadata'

export const meta: MetaFunction = () =>
  withAppMeta([
    { title: `How to use · ${appName}` },
    {
      name: 'description',
      content: `How to use ${appName}: notes, tasks, finances, health logs, sharing, encryption and the Gemini helpers.`,
    },
  ])

const Help = () => <HelpPage />

export default Help
