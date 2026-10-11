import { ComponentProps } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import {
  appName,
  author,
  githubRepo,
  githubUser,
} from '~/lib/constants/metadata'

const sections = ['features', 'private', 'everywhere'] as const

const linkClassName = 'text-primary underline underline-offset-4'

// Trans fills in the link text, so the anchor gets its children as props.
const ExternalLink = (properties: ComponentProps<'a'>) => (
  <a
    {...properties}
    target="_blank"
    rel="noreferrer"
    className={linkClassName}
  >
    {properties.children}
  </a>
)

export const AboutPage = () => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold">{t('navigation.about')}</h1>
        <p className="text-lg">
          <Trans
            i18nKey="about.description"
            values={{ appName }}
            components={{ span: <span className="text-primary" /> }}
          />
        </p>
      </div>
      {sections.map((key) => (
        <section
          key={key}
          aria-labelledby={`about-${key}`}
          className="grid gap-2"
        >
          <h2
            id={`about-${key}`}
            className="text-xl font-semibold"
          >
            {t(`about.${key}.title`)}
          </h2>
          <p className="text-muted-foreground">
            {t(`about.${key}.description`)}
          </p>
        </section>
      ))}
      <section
        aria-labelledby="about-made"
        className="grid gap-2"
      >
        <h2
          id="about-made"
          className="text-xl font-semibold"
        >
          {t('about.made.title')}
        </h2>
        <p className="text-muted-foreground">
          <Trans
            i18nKey="about.made.description"
            values={{ author }}
            components={{
              github: (
                <ExternalLink
                  href={`https://github.com/${githubUser}/${githubRepo}`}
                />
              ),
              changelog: (
                <Link
                  to="/changelog"
                  className={linkClassName}
                />
              ),
            }}
          />
        </p>
      </section>
    </div>
  )
}
