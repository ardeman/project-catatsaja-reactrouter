import { useTranslation } from 'react-i18next'

import { figures } from './figure'
import { helpSections as sections } from './type'

export const HelpPage = () => {
  const { t } = useTranslation()
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold">{t('navigation.help')}</h1>
        <p className="text-lg">{t('help.description')}</p>
      </div>
      <nav
        aria-labelledby="help-contents"
        className="grid gap-2"
      >
        <h2
          id="help-contents"
          className="text-sm font-medium text-muted-foreground"
        >
          {t('help.contents')}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {sections.map((key) => (
            <li key={key}>
              <a
                href={`#help-${key}`}
                className="inline-flex rounded-full border px-3 py-1 text-sm hover:bg-muted"
              >
                {t(`help.${key}.title`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
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
              className="scroll-mt-6 text-xl font-semibold"
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
