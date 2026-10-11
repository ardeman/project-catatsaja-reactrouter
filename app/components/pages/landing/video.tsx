import { Play } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { appName } from '~/lib/constants/metadata'

import posterEn from './video-poster-en.webp'
import posterId from './video-poster-id.webp'

// The promo video on YouTube, one per language.
const videos = {
  en: { id: 'iLcWg5vs8Hs', poster: posterEn },
  id: { id: 'GHMcXd9No0E', poster: posterId },
}

// Shows our own poster until the video is played: nothing loads from YouTube
// (or reaches Google) before that, and then only from youtube-nocookie.com.
export const LandingVideo = () => {
  const { t, i18n } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const lang = i18n.resolvedLanguage === 'id' ? 'id' : 'en'
  const video = videos[lang]
  const title = t('landing.video.title', { appName })

  return (
    <section
      aria-labelledby="video-title"
      className="mx-auto max-w-4xl px-4 pb-16 md:px-6 md:pb-24"
    >
      <h2
        id="video-title"
        className="text-center text-3xl font-bold tracking-tight text-balance"
      >
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-prose text-center text-muted-foreground">
        {t('landing.video.description')}
      </p>
      <div className="glass-surface mt-8 aspect-video overflow-hidden rounded-2xl border shadow-lg">
        {playing ? (
          <iframe
            key={video.id}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&hl=${lang}`}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full"
          />
        ) : (
          <button
            type="button"
            aria-label={t('landing.video.play')}
            title={t('landing.video.play')}
            onClick={() => setPlaying(true)}
            className="group relative block size-full cursor-pointer focus-visible:outline-none"
          >
            <img
              src={video.poster}
              alt=""
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
            <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-background/60 transition-transform group-hover:scale-110 group-focus-visible:ring-ring md:size-20">
              <Play className="ml-1 size-7 fill-current md:size-8" />
            </span>
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t('landing.video.note')}
      </p>
    </section>
  )
}
