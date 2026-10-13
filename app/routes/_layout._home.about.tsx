import { MetaFunction } from 'react-router'

import { AboutPage } from '~/components/pages/about'
import { appName, withAppMeta } from '~/lib/constants/metadata'

export const meta: MetaFunction = () =>
  withAppMeta([
    { title: `About · ${appName}` },
    {
      name: 'description',
      content: `The story behind ${appName}, who makes it and what it promises: the core stays free, and your data stays yours.`,
    },
  ])

const About = () => <AboutPage />

export default About
