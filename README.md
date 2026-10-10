<h1 align="center">
  project-catatsaja-reactrouter
</h1>

<p align="center">
  <a href="https://github.com/ardeman/project-catatsaja-reactrouter/actions/workflows/firebase-remix.yml" target="_blank">
    <img src="https://github.com/ardeman/project-catatsaja-reactrouter/actions/workflows/firebase-remix.yml/badge.svg?branch=main" alt="Deployment Status" />
  </a>
</p>

**Catat Saja** ("just write it down") is a personal productivity web app for notes, tasks, finances and health, in English and Bahasa Indonesia. Live at [catatsaja.ardeman.com](https://catatsaja.ardeman.com).

## Objective

One simple, private place to write things down and keep track of them:

- **Capture quickly:** a note or a checklist is one tap away, saves itself as you type, and works on a phone as well as on a desktop.
- **Share when needed:** any note or task can be shared with other users, read-only or editable, and updates show up for everyone in real time.
- **Track money in one place:** record income and expenses in several currencies, converted with your own rates and formatted the way you read numbers.

## Status

Notes, tasks, finances, health logs, sharing, accounts and currency settings are done and live, and the app installs as a standalone app. See the [Roadmap](#roadmap) for what's next.

## Features

**Done**

- **Notes:** rich Markdown editor (Milkdown) with live preview cards, pinning, autosave, and a page per note.
- **Tasks:** checklists with add-by-paste (one item per line), tap an item to edit it, reordering, check all, undo after removing an item, and completed items grouped at the bottom.
- **Saving:** notes and tasks save as you type and when you leave the page, with a "Saving… / Saved" status; a new note or task is kept when you leave it.
- **Search:** one search box finds notes, tasks, finances and health logs together by title and content (Ctrl/⌘ K or `/` from anywhere); "See all" filters a list.
- **Sharing:** find users by email and give them read or write access to a note or task; read-only is enforced by the database rules; copy a link; undo removing someone; shared items update in real time; a reader can remove a shared item from their own list.
- **Accounts:** email and password sign-up with email verification, Google sign-in and linking, forgot password, change email, display name, and the Google profile photo when signing in with Google.
- **Appearance:** light, dark or system theme, three text sizes, English or Bahasa Indonesia; previewed before saving and kept per user.
- **Finances:** books (for a month, a trip, a project) of income and expense entries with categories, quantity and date; totals and balance in the book's currency; entries in other currencies keep the exchange rate used, so totals never shift; pin and share like notes.
- **Finance analysis:** per book, insight tiles, cash flow and balance charts and spending by colour-coded category, with a table view; accounts to check the balance against; calculations in amount fields.
- **Health:** a log per person (yourself, a child, a parent), shared like notes: weight, height and BMI (Kemenkes, WHO or WHO Asia-Pacific categories), child growth against the WHO Child Growth Standards (birth to 5 years, percentiles and Kemenkes PMK 2/2020 status), blood sugar, uric acid and cholesterol with adult reference ranges (mg/dL or SI units), calories against a daily target, and period cycle estimates.
- **Currencies:** manage your own currencies (symbol, code, decimals, rate, a default one) and how amounts are written (separators, decimals, symbol or code, before or after), with a live preview.
- **Landing page:** what the app does, with previews of a note and a checklist, in both languages and themes; signed-in visitors go straight to their notes.
- **App:** installable as a standalone app ("Install app" on the landing page and in the account menu: the browser's install prompt, or the right steps for Safari, Firefox on Android and Chrome before it offers the prompt), opens offline, a changelog, about, privacy policy and terms pages, a 404 page, and a loading screen while signing in.

## Roadmap

**Planned**

- [ ] Finances: budgets.
- [ ] Health: WHO growth references for 5–19 years, and reminders.
- [ ] Gemini integration: the API key is set up in `.env.example` and the deploy workflow, but no feature uses it yet and its scope is not decided.

**Technical**

- [ ] Automated tests (there are none yet).
- [ ] Turn back on the ESLint rules that the 2026-10-09 upgrade switched off, and fix what they find (`eslint.config.mjs`).
- [ ] Drop the `@eslint/compat` wrapper once `eslint-plugin-react`, `-import` and `-jsx-a11y` support ESLint 10.
- [ ] TypeScript 7, once typescript-eslint supports it.
- [ ] Stop signed-in users from listing every profile: the rules still allow reading the whole `users` collection, which the email lookup for sharing needs. An email-lookup document per user (or a Cloud Function) would allow only exact lookups. When this is done, update the sharing paragraph of the privacy policy (`privacyPolicy.sharing`).
- [ ] Pass `ref` as a prop instead of `forwardRef` in `app/components/ui/` (React 19 style, before React removes `forwardRef`).

## Tech stack

The app is a single-page app (`ssr: false`) on Firebase Auth and Cloud Firestore, hosted on Firebase Hosting. The public pages (landing, about, privacy, terms, changelog) are also rendered to HTML at build time (`prerender` in `react-router.config.ts`) so search engines and link previews can read them.

| Item             | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Node.js          | 24 LTS (`.nvmrc`)                                                     |
| Package manager  | pnpm 12 through Corepack (`packageManager` in `package.json`)         |
| Framework        | React 19, React Router 8, Vite 8, TypeScript 6                        |
| UI               | Tailwind CSS 4, shadcn/ui (`new-york`, Radix), lucide icons, Milkdown |
| Forms            | react-hook-form + Zod 4                                               |
| i18n             | i18next / react-i18next, languages `en` and `id`                      |
| Firebase project | `catat-saja`                                                          |

## Getting started

Prerequisites: Node.js 24 with Corepack enabled (`corepack enable`, which provides the pinned pnpm), and [firebase-tools](https://firebase.google.com/docs/cli).

```sh
git clone https://github.com/ardeman/project-catatsaja-reactrouter.git
cd project-catatsaja-reactrouter
pnpm install           # also installs the Husky Git hooks
cp .env.example .env   # then fill in the values below
firebase login
firebase deploy --only firestore   # rules and indexes
pnpm dev               # http://localhost:5173
```

pnpm refuses package versions published less than a day ago (its `minimumReleaseAge` default), so a brand-new release can only be installed the next day. Dependency install scripts run only when allowed in `pnpm-workspace.yaml` (`allowBuilds`).

### Environment variables

`.env` is git-ignored. In CI the same names come from repository secrets.

| Variable                | Used for                                                       |
| ----------------------- | -------------------------------------------------------------- |
| `VITE_FIREBASE_*`       | Firebase web app config (Project settings → Your apps)         |
| `VITE_GRAVATAR_API_KEY` | Profile avatars from Gravatar                                  |
| `VITE_GEMINI_API_KEY`   | Gemini API (passed to the build; not read by the app code yet) |

Variables are read in one place, `app/lib/utils/environment.ts`.

## Commands

| Task                                                                                                          | Command                            |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Install dependencies                                                                                          | `pnpm install`                     |
| Dev server                                                                                                    | `pnpm dev`                         |
| Lint                                                                                                          | `pnpm lint`                        |
| Typecheck (generates route types first)                                                                       | `pnpm typecheck`                   |
| Unused files, exports and dependencies                                                                        | `pnpm knip`                        |
| Format                                                                                                        | `pnpm format`                      |
| Regenerate `public/site.webmanifest` from `scripts/generate-manifest.mjs` and `app/lib/constants/metadata.ts` | `pnpm generate:manifest`           |
| Production build (includes the manifest)                                                                      | `pnpm build`                       |
| Preview the production build                                                                                  | `pnpm preview`                     |
| Deploy Firestore rules and indexes                                                                            | `firebase deploy --only firestore` |
| Reinstall Git hooks                                                                                           | `pnpm prepare`                     |

**Checks** — run before every commit and pull request. It must pass with no errors:

```sh
pnpm validate   # lint + typecheck + knip
```

There is no automated test suite yet.

### Git hooks and commit messages

Husky installs two hooks:

- `pre-commit` runs lint-staged (`.lintstagedrc.cjs`): `eslint --fix` and `prettier --write` on staged code, `prettier --write` on CSS, JSON and Markdown.
- `commit-msg` runs commitlint with `@commitlint/config-conventional`.

Commit subjects use `type(scope)!: description`, with optional scope and `!` for breaking changes, for example `feat(finances): add currency preview`. Common types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci` and `chore`.

## Deployment

Every push to `main` runs `.github/workflows/firebase-remix.yml`: install, `pnpm validate`, build with the secrets above, and deploy `build/client` to the live channel of Firebase Hosting. It can also be started by hand from the Actions tab. Firestore rules and indexes are **not** deployed by the workflow; deploy them with the command above when `firestore.rules` or `firestore.indexes.json` change.

Hosting (`firebase.json`) serves the prerendered pages as files and every other path `__spa-fallback.html`, without trailing slashes. Pages are sent with `Cache-Control: no-cache` and the hashed files in `/assets/` are cached for a year, so a deploy never leaves browsers with pages that point at deleted files.

The service worker (`public/sw.js`, registered in production builds only) caches the app shell, the public pages and the files they load, so the installed app starts offline. Pages are fetched from the network first, so an online visit always gets the latest deploy; Firebase and Firestore requests are not touched. To try the production build with these rules locally: `pnpm build && npx firebase-tools emulators:start --only hosting` (port 5000 is often taken on macOS; it moves to the next free one).

## Project layout

```text
app/
  root.tsx            App shell: Firebase and theme providers, root layout, hydrate fallback
  routes.ts           Flat file routes plus a catch-all (catch-all.tsx)
  routes/             Route modules (thin: each renders one page component)
                        _layout._home.*   public pages (about, privacy, terms)
                        _layout.auth.*    sign in, sign up, forgot password
                        _layout._main.*   signed-in app (notes, tasks, finances, health, settings)
  apis/firestore/     Firestore reads and writes per collection (note, task, finance, health-log, user, currency)
  components/
    ui/               shadcn/ui primitives (generated)
    base/             Shared app components built on ui/
    layouts/          Navbar, sidebar, footer, root layout
    pages/            One folder per page: index.tsx, context, parts, type.ts
  lib/
    configs/          Firebase and page config
    constants/        Metadata (also the source of the web manifest), Firebase constants
    contexts/         Firebase and theme React contexts
    hooks/            One hook per action (use-get-*, use-create-*, use-update-*, ...)
    types/            Request/response types per domain
    validations/      zod schemas per domain
    utils/            Environment, parsers, auth helpers, cn()
  content/            changelog.ts: release notes for /changelog, in both languages
  localization/       i18next setup; locales/<en|id>/common.json and zod.json
  styles/             tailwind.css (Tailwind 4 config: theme, plugins, colours), Milkdown editor theme
public/               Icons (maskable ones for Android), site.webmanifest (generated), sw.js (service worker)
scripts/              generate-manifest.mjs
firestore.rules       Security rules (owner and read/write permission lists)
firestore.indexes.json
```

## Documentation map

Each topic has one home. Update that file instead of copying its content somewhere else.

| File                     | Audience                                         | Owns                                                              |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------- |
| `README.md`              | Everyone                                         | Objective, features, roadmap, setup, commands, deployment, layout |
| `AGENTS.md`              | AI coding agents (and humans who want the rules) | Definition of done, conventions, guardrails, decisions            |
| `CLAUDE.md`, `GEMINI.md` | Claude Code, Gemini CLI                          | Only an import of `AGENTS.md`                                     |
| `LICENSE`                | Everyone                                         | Terms for using the code (MIT)                                    |

Codex, Cursor, GitHub Copilot and other agents that follow the [AGENTS.md](https://agents.md) convention read `AGENTS.md` directly.

## Forking

Feel free to fork this repository. If you do, please give credit by linking back to [ardeman.com](https://ardeman.com/). Thank you!

## License

[MIT](LICENSE). Third-party packages keep their own licenses.
