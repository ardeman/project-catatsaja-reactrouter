import { useTranslation } from 'react-i18next'

import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { HelpContents } from './contents'
import { figures } from './figure'
import { helpSections as sections } from './type'

export const HelpPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.help'))
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold">{t('navigation.help')}</h1>
        <p className="text-lg">{t('help.description')}</p>
      </div>
      <HelpContents />
      {sections.map((key) => {
        const Figure = figures[key]
        return (
          <section
            key={key}
            aria-labelledby={`help-${key}`}
            className="grid gap-3"
          >
            <h2
              id={`help-${key}`}
              className="scroll-mt-28 text-xl font-semibold sm:scroll-mt-40"
            >
              {t(`help.${key}.title`)}
            </h2>
            <p className="text-muted-foreground">
              {t(`help.${key}.description`)}
            </p>
            <Figure />
            <ul className="grid list-disc gap-1.5 pl-5 text-muted-foreground marker:text-primary">
              {(
                t(`help.${key}.steps`, { returnObjects: true }) as string[]
              ).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
