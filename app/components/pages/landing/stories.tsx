import { Play } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '~/lib/utils/shadcn'

import adit from './people/adit.svg'
import dimas from './people/dimas.svg'
import maya from './people/maya.svg'
import rina from './people/rina.svg'
import sari from './people/sari.svg'

// The full stories video on YouTube, one per language; each person plays
// their own chapter of it (times from the render's chapters, `meta.json`),
// so both languages look the same. The Shorts repeat these clips, so they
// aren't embedded.
const fullStories = { en: 'KAJqhUYZLLQ', id: 'Cxjiuu2HNwU' }

const stories = [
  {
    key: 'rina',
    faces: [rina],
    en: { start: 0, end: 22 },
    id: { start: 0, end: 23 },
  },
  {
    key: 'couple',
    faces: [sari, dimas],
    en: { start: 22, end: 39 },
    id: { start: 23, end: 41 },
  },
  {
    key: 'adit',
    faces: [adit],
    en: { start: 39, end: 54 },
    id: { start: 41, end: 56 },
  },
  {
    key: 'maya',
    faces: [maya],
    en: { start: 54, end: 82 },
    id: { start: 56, end: 86 },
  },
] as const

type TStory = (typeof stories)[number]

const embedUrl = (story: TStory, lang: 'en' | 'id') => {
  const parameters = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    hl: lang,
    start: String(story[lang].start),
    end: String(story[lang].end),
  })
  return `https://www.youtube-nocookie.com/embed/${fullStories[lang]}?${parameters}`
}

// Nothing loads from YouTube until a story is chosen, as with the tour video.
export const LandingStories = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage === 'id' ? 'id' : 'en'
  const [playing, setPlaying] = useState<TStory>()
  const playerReference = useRef<HTMLDivElement>(null)

  const play = (story: TStory) => {
    setPlaying(story)
    // On phones the player is below all four cards.
    requestAnimationFrame(() =>
      playerReference.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      }),
    )
  }

  return (
    <section
      aria-labelledby="stories-title"
      className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24"
    >
      <h2
        id="stories-title"
        className="text-center text-3xl font-bold tracking-tight text-balance"
      >
        {t('landing.stories.title')}
      </h2>
      <p className="mx-auto mt-3 max-w-prose text-center text-muted-foreground">
        {t('landing.stories.description')}
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stories.map((story) => {
          const name = t(`landing.stories.people.${story.key}.name`)
          const isPlaying = playing?.key === story.key
          return (
            <li key={story.key}>
              <button
                type="button"
                aria-pressed={isPlaying}
                aria-label={t('landing.stories.play', { name })}
                title={t('landing.stories.play', { name })}
                onClick={() => play(story)}
                className={cn(
                  'group glass-surface flex size-full cursor-pointer flex-col items-center gap-3 rounded-xl border p-5 text-center transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  isPlaying && 'ring-2 ring-primary',
                )}
              >
                <span className="relative">
                  <span className="flex -space-x-3">
                    {story.faces.map((face) => (
                      <img
                        key={face}
                        src={face}
                        alt=""
                        width={80}
                        height={80}
                        className="size-20 shrink-0 rounded-full ring-4 ring-background"
                      />
                    ))}
                  </span>
                  <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 size-4 fill-current" />
                  </span>
                </span>
                <span className="grid gap-0.5">
                  <span className="font-semibold">{name}</span>
                  <span className="text-xs text-primary">
                    {t(`landing.stories.people.${story.key}.role`)}
                  </span>
                </span>
                <span className="text-sm text-balance">
                  “{t(`landing.stories.people.${story.key}.quote`)}”
                </span>
                <span className="mt-auto rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {t(`landing.stories.people.${story.key}.feature`)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {playing && (
        <div
          ref={playerReference}
          className="glass-surface mx-auto mt-6 aspect-video max-w-4xl scroll-mt-24 overflow-hidden rounded-2xl border shadow-lg"
        >
          <iframe
            key={`${playing.key}-${lang}`}
            src={embedUrl(playing, lang)}
            title={t('landing.stories.play', {
              name: t(`landing.stories.people.${playing.key}.name`),
            })}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t('landing.stories.note')}
      </p>
    </section>
  )
}
