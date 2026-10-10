import { useTranslation } from 'react-i18next'

import { releases, TChangeKind } from '~/content/changelog'
import { githubRepo, githubUser } from '~/lib/constants/metadata'
import { cn } from '~/lib/utils/shadcn'

const kindClassName: Record<TChangeKind, string> = {
  new: 'bg-primary text-primary-foreground',
  improved: 'bg-muted text-foreground',
  fixed: 'bg-muted text-muted-foreground',
}

const groupedReleases = [...new Set(releases.map((release) => release.date))]
  .toSorted((a, b) => b.localeCompare(a))
  .map(
    (date) =>
      [date, releases.filter((release) => release.date === date)] as const,
  )

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
      {groupedReleases.map(([date, dayReleases]) => (
        <section
          key={date}
          aria-labelledby={`release-${date}`}
          className="grid gap-5"
        >
          <h2
            id={`release-${date}`}
            className="text-xl font-semibold"
          >
            <time dateTime={date}>{formatDate(date)}</time>
          </h2>
          {dayReleases.map((release, index) => (
            <div
              key={`${release.title.en}-${index}`}
              className="grid gap-3"
            >
              <h3 className="font-semibold">{release.title[language]}</h3>
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
            </div>
          ))}
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
