import { MetaFunction } from 'react-router'

import { PrivacyPolicyPage } from '~/components/pages/privacy-policy'
import { appName, withAppMeta } from '~/lib/constants/metadata'

export const meta: MetaFunction = () =>
  withAppMeta([
    { title: `Privacy policy · ${appName}` },
    {
      name: 'description',
      content: `How ${appName} handles your data: what is stored, who can read it, end-to-end encryption and the optional Gemini helpers.`,
    },
  ])

const PrivacyPolicy = () => <PrivacyPolicyPage />

export default PrivacyPolicy
