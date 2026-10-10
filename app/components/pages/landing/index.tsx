import {
  ListTodo,
  LucideIcon,
  MonitorSmartphone,
  StickyNote,
  Users,
  Wallet,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { InstallApp } from '~/components/base/install-app'
import { LanguageSelector } from '~/components/base/language-selector'
import { ModeToggle } from '~/components/base/mode-toggle'
import { AboutFooter } from '~/components/layouts/about-footer'
import { Button } from '~/components/ui/button'
import { appleIcon, appName } from '~/lib/constants/metadata'

import { FinancePreview, NotePreview, TaskPreview } from './preview'

type TFeature = {
  key: string
  icon: LucideIcon
}

const features: TFeature[] = [
  { key: 'notes', icon: StickyNote },
  { key: 'tasks', icon: ListTodo },
  { key: 'sharing', icon: Users },
  { key: 'everywhere', icon: MonitorSmartphone },
  { key: 'finances', icon: Wallet },
]

export const LandingPage = () => {
  const { t } = useTranslation()

  return (
    <div className="app-background flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50">
        <div
          aria-hidden="true"
          className="glass-surface pointer-events-none absolute inset-0 -z-10 border-b"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link
            to="/"
            className="mr-auto flex items-center gap-2 font-semibold whitespace-nowrap"
          >
            <img
              src={appleIcon}
              alt=""
              className="size-8"
            />
            {appName}
          </Link>
          <LanguageSelector />
          <ModeToggle />
          {/* Returning users sign in from here; new ones have the hero's button. */}
          <Button
            asChild
            variant="ghost"
            className="hidden sm:inline-flex"
          >
            <Link to="/auth/sign-up">{t('landing.getStarted')}</Link>
          </Button>
          <Button
            asChild
            className="glass-surface glass-primary border"
          >
            <Link to="/auth/sign-in">{t('landing.signIn')}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm font-medium text-primary">
              {t('landing.hero.eyebrow')}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
              {t('landing.hero.title')}
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              <Trans
                i18nKey="landing.hero.description"
                values={{ appName }}
                components={{ span: <span className="text-foreground" /> }}
              />
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="glass-surface glass-primary border"
              >
                <Link to="/auth/sign-up">{t('landing.getStarted')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="glass-surface"
              >
                <Link to="/auth/sign-in">{t('landing.signIn')}</Link>
              </Button>
              <InstallApp>
                {({ onClick, label, icon }) => (
                  <Button
                    size="lg"
                    variant="ghost"
                    className="gap-2"
                    onClick={onClick}
                  >
                    {icon}
                    {label}
                  </Button>
                )}
              </InstallApp>
            </div>
          </div>
          {/* Phones: the cards stack down the page. Wider: note and checklist
              on the left, the finance book on top of both on the right. */}
          <div className="relative mx-auto h-[41rem] w-full max-w-md sm:h-[28rem]">
            <NotePreview className="absolute top-0 left-0 z-10 -rotate-3" />
            <FinancePreview className="absolute top-[11rem] right-0 z-20 rotate-2 sm:top-1/2 sm:z-30 sm:-translate-y-1/2" />
            <TaskPreview className="absolute top-[26.5rem] left-2 z-30 -rotate-1 sm:top-auto sm:bottom-0 sm:left-0 sm:z-20" />
          </div>
        </section>

        <section
          aria-labelledby="features-title"
          className="border-t border-border/40 bg-background/40"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <h2
              id="features-title"
              className="max-w-2xl text-3xl font-bold tracking-tight text-balance"
            >
              {t('landing.features.title')}
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="glass-surface rounded-xl border p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold">
                    {t(`landing.features.${key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`landing.features.${key}.description`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-balance">
            {t('landing.cta.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-prose text-muted-foreground">
            {t('landing.cta.description')}
          </p>
          <Button
            asChild
            size="lg"
            className="glass-surface glass-primary mt-6 border"
          >
            <Link to="/auth/sign-up">{t('landing.getStarted')}</Link>
          </Button>
        </section>
      </main>

      <AboutFooter />
    </div>
  )
}
