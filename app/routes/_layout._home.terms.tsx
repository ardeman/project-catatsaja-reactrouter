import { MetaFunction } from 'react-router'

import { TermsOfServicePage } from '~/components/pages/terms-of-service'
import { appName, withAppMeta } from '~/lib/constants/metadata'

export const meta: MetaFunction = () =>
  withAppMeta([
    { title: `Terms of service · ${appName}` },
    {
      name: 'description',
      content: `The terms for using ${appName}.`,
    },
  ])

const TermsOfService = () => <TermsOfServicePage />

export default TermsOfService
