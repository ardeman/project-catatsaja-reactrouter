import { MetaFunction } from 'react-router'

import { LandingPage } from '~/components/pages/landing'
import { appName, withAppMeta } from '~/lib/constants/metadata'

const siteUrl = 'https://catatsaja.ardeman.com'
const title = `${appName}: notes, checklists and money in one place`
const description =
  'Write notes, keep checklists, track income and expenses, and share them with the people you choose, on your phone and your computer. In English and Bahasa Indonesia.'

// Rendered into the landing page's HTML at build time, for search engines
// and link previews.
export const meta: MetaFunction = () =>
  withAppMeta([
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: `${siteUrl}/` },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: appName },
    { property: 'og:url', content: `${siteUrl}/` },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: `${siteUrl}/logo.png` },
    { name: 'twitter:card', content: 'summary' },
  ])

const Landing = () => <LandingPage />

export default Landing
