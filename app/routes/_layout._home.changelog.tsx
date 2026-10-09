import { MetaFunction } from 'react-router'

import { ChangelogPage } from '~/components/pages/changelog'
import { appName, withAppMeta } from '~/lib/constants/metadata'

export const meta: MetaFunction = () =>
  withAppMeta([
    { title: `Changelog · ${appName}` },
    {
      name: 'description',
      content: `What's new in ${appName}: new features, improvements and fixes.`,
    },
  ])

const Changelog = () => <ChangelogPage />

export default Changelog
