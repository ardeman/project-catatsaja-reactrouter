import { useTranslation } from 'react-i18next'

import { releases, TChangeKind } from '~/content/changelog'
import { githubRepo, githubUser } from '~/lib/constants/metadata'
import { cn } from '~/lib/utils/shadcn'

const kindClassName: Record<TChangeKind, string> = {
  new: 'bg-primary text-primary-foreground',
  improved: 'bg-muted text-foreground',
  fixed: 'bg-muted text-muted-foreground',
}

export const ChangelogPage = () => {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'id' ? 'id' : 'en'
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(language, {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))

  return (
    <div className="grid gap-10">
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">{t('navigation.changelog')}</h1>
        <p className="text-muted-foreground">{t('changelog.description')}</p>
      </div>
      {releases.map((release) => (
        <section
          key={release.date}
          aria-labelledby={`release-${release.date}`}
          className="grid gap-3"
        >
          <div className="grid gap-0.5">
            <time
              dateTime={release.date}
              className="text-sm text-muted-foreground"
            >
              {formatDate(release.date)}
            </time>
            <h2
              id={`release-${release.date}`}
              className="text-xl font-semibold"
            >
              {release.title[language]}
            </h2>
          </div>
          <ul className="grid gap-2">
            {release.changes.map((change) => (
              <li
                key={change.text.en}
                className="flex items-start gap-3"
              >
                <span
                  className={cn(
                    'mt-0.5 w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium',
                    kindClassName[change.kind],
                  )}
                >
                  {t(`changelog.kind.${change.kind}`)}
                </span>
                <span>{change.text[language]}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted-foreground">
        <a
          href={`https://github.com/${githubUser}/${githubRepo}/commits/main/`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t('changelog.fullHistory')}
        </a>
      </p>
    </div>
  )
}
