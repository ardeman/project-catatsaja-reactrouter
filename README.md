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
- **Tasks:** checklists with an Add button or Enter, add-by-paste (one item per line), tap an item or its pencil to edit it, reordering, check all, undo after removing an item, and completed items grouped at the bottom. Unfinished item text is kept when saving or leaving.
- **Saving:** notes and tasks save as you type and when you leave the page, with a "Saving… / Saved" status; a new note or task is kept when you leave it. Undo and redo in the icon bar of every note, task list, finance book and health log step over the whole item (a step at each pause in changes; Gemini's changes are a step of their own).
- **Search:** one search box finds notes, tasks, finances and health logs together by title and content (Ctrl/⌘ K or `/` from anywhere); "See all" filters a list.
- **Offline:** items are kept in the browser, so saves made offline upload when you're back online, even after a reload; a new entry or Quick add text you haven't saved comes back when you open the book again. Signing out removes both from that browser.
- **Archive:** move a note, task list, book or health log out of your main list without deleting it; it waits under Archived at the bottom, for you only, and comes back with one tap.
- **Sharing:** find users by email and invite them with read or write access to a note or task; it joins their lists only once they accept (or decline); read-only is enforced by the database rules; copy a link; undo removing someone; shared items update in real time; a reader can remove a shared item from their own list.
- **End-to-end encryption:** notes, tasks, books and health logs encrypted on the device (Web Crypto) so nobody else, including the database, can read them; a passphrase, a recovery code and optional passkey unlock; shared items sealed for each person; on for new accounts, opt-in in Settings → Account for existing ones, and can be turned off again; works alongside unencrypted accounts, sharing both ways.
- **Accounts:** email and password sign-up with email verification, Google sign-in and linking, forgot password, change email, display name, and the Google profile photo when signing in with Google.
- **Appearance:** light, dark or system theme, three text sizes, English or Bahasa Indonesia; previewed before saving and kept per user.
- **Finances:** books (for a month, a trip, a project) of income and expense entries with categories, quantity and date; totals and balance in the book's currency; entries in other currencies keep the exchange rate used, so totals never shift; pin and share like notes.
- **Gemini helpers** (Firebase AI Logic, opt-in after a one-time notice that can be taken back in Settings → Account; something is sent only when the person uses a feature, and the result is checked before anything changes):
  - **Receipt scanning:** in a finance book, a photo of a receipt is read by Gemini (Firebase AI Logic) into one entry for its total or one per item (choosing which items to add), checked before adding (discounts per item, the date checked); categories still come from the on-device suggestions.
  - **Quick add:** typed text such as "makan siang 45rb, gaji 8jt kemarin" read into entries to check and choose from.
  - **Note helpers** (the Sparkles icon in a note's icon bar): summarise, tidy up, translate English ↔ Indonesian (previewed, undoable), or turn a note into a new task list.
- **Finance analysis:** per book, insight tiles, cash flow and balance charts and spending by colour-coded category, with a table view; accounts to check the balance against; calculations in amount fields.
- **Date entry:** type dates with automatic separators, including English or Indonesian month names or choose from a calendar; the format defaults to DD-MM-YYYY and can be changed in Settings → General.
- **Health:** a log per person (yourself, a child, a parent), shared like notes: weight, height and BMI (Kemenkes, WHO or WHO Asia-Pacific categories), child growth from birth to 19 years against the WHO Child Growth Standards (to 5 years) and the WHO Growth Reference for school-age children and adolescents (5 to 19 years; weight for age to 10), with percentiles and Kemenkes PMK 2/2020 status, blood sugar, uric acid and cholesterol with adult reference ranges (mg/dL or SI units), calories against a daily target, and period cycle estimates; reminders to measure every few days or before an expected period, shown when due (on the log, its card and the Health menu) and sent as push notifications.
- **Notifications:** a bell lists invitations, due health reminders and medicine doses, encrypted items others can't read, and a newer version of the app. Push notifications per device (offered once on each device after the encryption step, and in Settings → General) for invitations, health reminders and every medicine dose, sent by Cloud Functions; their text is sealed on the sender's device for each receiving device, so the server sees only times and recipients, and each device can hide titles on its lock screen.
- **Currencies:** manage your own currencies (symbol, code, decimals, rate, a default one) and how amounts are written (separators, decimals, symbol or code, before or after), with a live preview.
- **Landing page:** what the app does, with previews of a note and a checklist, four people's stories and a tour video (YouTube, loaded only on play), in both languages and themes; signed-in visitors go straight to their notes.
- **App:** installable as a standalone app ("Install app" on the landing page and in the account menu: the browser's install prompt, or the right steps for Safari, Firefox on Android and Chrome before it offers the prompt), opens offline, a how-to-use guide, a changelog, about, privacy policy and terms pages, a 404 page, and a loading screen while signing in.

## Roadmap

**Upcoming (dated)**

- [ ] Check push notifications on a real phone (the emulators have no push service): invitations work (checked 2026-10-26); left are turning them on from the one-time step and from Settings, a health reminder and a medicine dose, on Android and on an iPhone with the installed app.

**Planned**

- [ ] Finances: budgets, a monthly limit per category with what is left (decide first whether it is free or Plus: it is also listed under Plus below).
- [ ] Finances: recurring entries (salary, rent, bills) confirmed with one tap when due, instead of typed again.
- [ ] Finances: filter a book's entries by category, type and date range.
- [ ] Finances (Plus): savings goals on a book, to know how much to save each month. A goal has a name, an amount, a due month and, once done, what was spent; they live in the book's encrypted content (a new content field, so the rules, `contentFields` and an end-to-end test). Computed in the browser, nothing stored: goals grouped by due month with a running total, the shortfall against the book's savings (its accounts' total when it has accounts, as that is what the person holds, otherwise its balance from entries), paydays left before each due month (from a payday the person sets, suggested from the book's largest regular income), and the saving per payday each due month needs, with the highest shown as "save this much a month". Later: yearly extra income (THR, 13th-month salary, bonus) taken off the shortfall, and savings counted across several books the person can read.
- [ ] Finances: transfers between a book's accounts, counted as neither income nor expense.
- [ ] Finances analysis, one release each, in order:
  1. A date range at the top of Analysis (this month, last 3 months, this year, all, custom) that every chart and table follows, and a "Group by" control (category, item, day, week, month, day of week) replacing the automatic period size. Computed in the browser; nothing stored.
  2. Compare two periods (by default the chosen range and the one before it): income, expense, net and each category, with the change in amount and %. Computed only.
  3. Your own groups of categories (such as Needs = food + bills) with totals and shares. Decide first where they live: on the book (shared with its people; a new content field, so the rules, `contentFields` and an end-to-end test) or on the profile (personal, and usable across books in step 4).
  4. Compare books: a screen to pick several books and see income, expense and net per month for each. Books in other currencies are converted with the person's currency settings, so unlike a book's own totals these can change when a rate does.
- [ ] Tasks: due dates with reminders, sent as push notifications like health reminders.
- [ ] Export all your data as a file, decrypted on the device: a backup in case the passphrase is lost. Free, apart from Plus's finance exports and reports.
- [ ] Trash: deleted items kept for 30 days, beyond the Undo toast.
- [ ] Labels shared across notes, tasks and books (such as "Holiday 2026").

**Revenue**

An optional Catat Saja Plus subscription pays for what costs money to run; the core stays free (AGENTS.md → Decisions). In order:

- [ ] Measure: a tracked link per promo video (`utm_campaign` per story: `rina`, `couple`, `adit`, `maya`, `nadia`, `wulan`, `hendra`) and sign-ups by source in Analytics.
- [ ] Find who pays: post the per-person stories videos, then a small paid test per person for a week; the cheapest active sign-ups pick which Plus features come first.
- [ ] A donation link (Trakteer or Saweria) and a Plus waitlist with an early-bird price, to check that people will pay.
- [ ] Plus: Gemini on the paid tier with higher limits (photos not used to improve Google's services; a few uses a month stay free), health reports as PDF for the doctor or posyandu, budgets, exports and yearly finance reports, and a family plan.
- [ ] Payments through [Dahlunas](https://github.com/ardeman/project-dahlunas-go), Ardeman's own shop (Midtrans for QRIS and e-wallets, Lemon Squeezy for other countries), decided on 2026-10-26 instead of a gateway of Catat Saja's own. Plus is a real subscription written to the person's account, not an unlock code. Dahlunas needs new work for it (its README → Roadmap → Catat Saja): checkout started from a signed-in account with a short-lived signed token naming it, recurring billing (Midtrans renews only saved cards and GoPay, not QRIS, so prepaid months or years paid by QRIS with a reminder email are the fallback), and a delivery that calls Catat Saja instead of emailing a code. Here it needs the Blaze plan and a Cloud Function that checks Dahlunas's signature and writes the person's plan and end date, which the rules don't let users change. Start once Plus has a feature to sell. Update the terms, the privacy policy (Dahlunas handles the payment and keeps the account ID with the order) and the changelog at launch.

**Technical**

- [ ] Find why copying a book from the list sometimes never saves on the CI runner (rarely locally), then check copy, delete and Undo from the list again in `tests/e2e/sharing.test.mjs` ("month documents"). Known: the months are read, then nothing is written: no write is queued (Firestore's IndexedDB shows one primary tab, network on, no pending writes), no toast, no browser error; it didn't happen with Firestore's debug log on. Next: log each step of `handleDuplicateFinance` → `createFinance` → `createShared` on a draft pull request (checked by CI, not deployed).
- [ ] The note page loads 1.1 MB of JavaScript for the editor (Milkdown with CodeMirror): load it only when a note opens, and leave out code languages nobody uses.
- [ ] More end-to-end tests (today they cover encryption, sharing, month documents, the AI features, health reminders and medicines; archiving, blocking and offline drafts have none yet; the rules have their own tests).
- [ ] Read form values with `useWatch` instead of react-hook-form's `watch()`, then turn on `react-hooks/incompatible-library` (`eslint.config.mjs`).
- [ ] Drop the `@eslint/compat` wrapper once `eslint-plugin-react`, `-import` and `-jsx-a11y` support ESLint 10.
- [ ] TypeScript 7, once typescript-eslint supports it.

## Tech stack

The app is a single-page app (`ssr: false`) on Firebase Auth and Cloud Firestore, hosted on Firebase Hosting. The public pages (landing, about, help, privacy, terms, changelog) are also rendered to HTML at build time (`prerender` in `react-router.config.ts`) so search engines and link previews can read them.

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
pnpm dlx firebase-tools@15.33.0 login
pnpm dlx firebase-tools@15.33.0 deploy --only firestore   # rules and indexes
pnpm dlx firebase-tools@15.33.0 deploy --only functions   # push notifications (Blaze plan)
pnpm dev               # http://localhost:5173
```

Separate projects (the promo video project) are found through `external-projects.json`: copy `external-projects.example.json` to it and point each section's `folder`, `readme` and `rules` at your checkouts. Like `.env`, the copy is not committed. The promo and stories videos are made in the video project (`video_marketing`); no media or promo scripts go in this repository.

pnpm refuses package versions published less than a day ago (its `minimumReleaseAge` default), so a brand-new release can only be installed the next day. Dependency install scripts run only when allowed in `pnpm-workspace.yaml` (`allowBuilds`).

### Environment variables

`.env` is git-ignored. In CI the same names come from repository secrets.

| Variable                     | Used for                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_*`            | Firebase web app config (Project settings → Your apps)                                                                                                         |
| `VITE_GRAVATAR_API_KEY`      | Profile avatars from Gravatar                                                                                                                                  |
| `VITE_FCM_VAPID_KEY`         | Optional. Public key of the web push key pair (Project settings → Cloud Messaging → Web Push certificates); push notifications are off without it              |
| `VITE_APP_CHECK_SITE_KEY`    | Optional. reCAPTCHA Enterprise site key for Firebase App Check; App Check is off without it                                                                    |
| `VITE_APP_CHECK_DEBUG_TOKEN` | Development only. A registered App Check debug token, kept in the ignored `.env`; ignored in production                                                        |
| `VITE_USE_EMULATORS`         | Development only (not set in the workflow): `true` runs `pnpm dev` against the local Auth, Firestore and Functions emulators (`pnpm emulators`, needs Java 21) |

Variables are read in one place, `app/lib/utils/environment.ts`.

When developing against Firebase with App Check enabled, create a debug token in Firebase console → App Check → Apps → the web app's menu → Manage debug tokens, and save it as `VITE_APP_CHECK_DEBUG_TOKEN` in `.env`. Restart `pnpm dev` after changing it. This lets local browsers use the same registered token instead of generating unregistered ones that receive HTTP 403. Without that variable, register each browser's token printed in its console. Keep debug tokens private and revoke them in Firebase if exposed. The emulator mode needs no token. See [Firebase's debug provider guide](https://firebase.google.com/docs/app-check/web/debug-provider).

## Commands

| Task                                                                                                                          | Command                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Install dependencies                                                                                                          | `pnpm install`                                            |
| Dev server                                                                                                                    | `pnpm dev`                                                |
| Lint                                                                                                                          | `pnpm lint`                                               |
| Typecheck the app and the Cloud Functions (generates route types first)                                                       | `pnpm typecheck`                                          |
| Unused files, exports and dependencies                                                                                        | `pnpm knip`                                               |
| Format                                                                                                                        | `pnpm format`                                             |
| Regenerate `public/site.webmanifest` from `scripts/generate-manifest.mjs` and `app/lib/constants/metadata.ts`                 | `pnpm generate:manifest`                                  |
| Redraw every icon in `public/` (PNGs, `favicon.ico`, `logo.svg`) from `scripts/icon/logo.svg`, with Chrome through Playwright | `pnpm generate:icons`                                     |
| Production build (includes the manifest)                                                                                      | `pnpm build`                                              |
| Preview the production build                                                                                                  | `pnpm preview`                                            |
| Build the Cloud Functions (`functions/src` to `functions/lib`)                                                                | `pnpm build:functions`                                    |
| Rewrite `functions/package-lock.json` after changing `functions/package.json` (npm, releases at least a day old)              | `pnpm lock:functions`                                     |
| Run the Auth, Firestore and Functions emulators (with `VITE_USE_EMULATORS=true`; Java 21; builds the functions first)         | `pnpm emulators`                                          |
| Deploy Firestore rules and indexes (when pnpm asks which packages may build, choose none: firebase-tools doesn't need them)   | `pnpm dlx firebase-tools@15.33.0 deploy --only firestore` |
| Deploy the Cloud Functions (checks the lockfile and builds them first)                                                        | `pnpm dlx firebase-tools@15.33.0 deploy --only functions` |
| Maintenance mode and the oldest app allowed, with your gcloud sign-in (README → Maintenance mode)                             | `pnpm maintenance status\|on\|off`                        |
| Reinstall Git hooks                                                                                                           | `pnpm prepare`                                            |

**Checks** — run before every commit and pull request. It must pass with no errors:

```sh
pnpm validate   # lint + typecheck + knip + unit tests
```

**Rules tests** — `pnpm test:rules` runs `tests/firestore-rules.test.mjs` against the Firestore emulator (it needs Java 21). The deploy workflow runs them before every deploy, so they don't have to pass locally.

**End-to-end tests** — `pnpm test:e2e` runs four suites sequentially against the Auth and Firestore emulators, using Playwright and the installed Google Chrome (needs Java 21 and port 5199 free):

- `tests/e2e/encryption.test.mjs`: the dependent encryption lifecycle with Ana, Budi and Cici.
- `tests/e2e/sharing.test.mjs`: independent accounts, sharing suggestions and invitations (with the title sealed for the invited person's push devices), read-only note editing, archiving, blocking, and encrypted finance month storage.
- `tests/e2e/ai.test.mjs`: receipt scanning, quick add, note and task list helpers, dictation (with Chrome's fake microphone) and taking back consent, with Gemini replaced by fixed answers, plus health reminders and medicines.
- `tests/e2e/ui.test.mjs`: interface behaviour only: adding, editing and reordering tasks and keeping unfinished task input, touch cursor placement on mobile, note keyboard saving with and without encryption, button and right-click formatting (touch and hold left to the phone), undo and redo in task lists, books and health logs, and the one-time notifications step after encryption (as an iPhone outside the installed app, since the emulators have no push service).

The deploy workflow runs the four files in parallel on separate runners, each with its own app and emulators, and runs a failed file once more before it counts as failed. Every suite except `ui` must pass before a deploy: they guard what is stored, shared and encrypted, while a `ui` failure shows in the run without blocking it. A push or pull request that changes only Markdown or `docs/` skips them. Scenarios within each file run in order; the local command stays sequential to avoid port and database conflicts. For adding or splitting suites, follow [AGENTS.md](AGENTS.md).

Locally, run `pnpm validate` and only the E2E file or scenario affected by a change. The full E2E suite is not required locally before each push; CI runs it before deployment. For example, with Java 21 on your path, check task editing with:

```sh
pnpm dlx firebase-tools@15.33.0 emulators:exec --only auth,firestore --project demo-catatsaja 'node --test --test-concurrency=1 --test-name-pattern="task input" tests/e2e/ui.test.mjs'
```

For documentation and static crawler files, no local E2E run is needed. Reuse passing checks when the relevant code is unchanged. Run the full local suite when requested or when investigating a failure that targeted tests cannot resolve.

### Git hooks and commit messages

Husky installs two hooks:

- `pre-commit` runs lint-staged (`.lintstagedrc.cjs`): `eslint --fix` and `prettier --write` on staged code, `prettier --write` on CSS, JSON and Markdown.
- `commit-msg` runs commitlint with `@commitlint/config-conventional`.

Commit subjects use `type(scope)!: description`, with optional scope and `!` for breaking changes, for example `feat(finances): add currency preview`. Common types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci` and `chore`.

## Deployment

`.github/workflows/firebase-remix.yml` runs checks on every push to `main`, pull request, every Monday (to catch a runner, Chrome or emulator change before it blocks a deploy) and by hand. **validation** installs dependencies, runs `pnpm validate` and the Firestore rules tests (`pnpm test:rules`, with Java). **changes** looks at what a push or pull request changed; when it is only Markdown or `docs/`, the end-to-end tests are skipped. Otherwise, in parallel, the **e2e** matrix runs each end-to-end test file on its own runner, with its own app, Auth and Firestore emulators, and Chrome installed by Playwright, retrying a failed file once. All four suites finish even if one fails. This shortens the wait at the cost of more runner minutes. **checks** keeps the existing status name for branch protection and fails unless validation and every E2E suite succeed (the `ui` suite may fail without blocking; skipped suites pass only for docs-only changes). **deploy** runs after it, only for a push to `main` or a run by hand on `main`: build with the secrets above and deploy `build/client` to the live channel of Firebase Hosting, one deploy at a time. Nothing comes from the runner image (Node from `.nvmrc`, pnpm from `packageManager`, Java, Chrome and the Firebase CLI pinned or installed), so moving `ubuntu-latest` to a new Ubuntu doesn't change the build; Dependabot (`.github/dependabot.yml`) proposes action updates monthly. Firestore rules and indexes are **not** deployed by the workflow; deploy them with the command above when `firestore.rules` or `firestore.indexes.json` change.

The Cloud Functions (`functions/`, push notifications) aren't deployed by the workflow either, so its service account keeps only its Hosting roles: deploy them with `deploy --only functions` when `functions/` changes, after the rules they rely on and before the app that writes for them. Cloud Build installs them with npm, outside the pnpm workspace, from `functions/package-lock.json`: run `pnpm lock:functions` after changing `functions/package.json` (it resolves only releases at least a day old, like pnpm), and `pnpm validate` and the deploy refuse a lockfile that no longer matches. Each deploy leaves a container image in Artifact Registry; the first functions deploy asks how many days to keep them (1 is set), and `pnpm dlx firebase-tools@15.33.0 functions:artifacts:setpolicy --location asia-southeast2 --days 1` changes it later (it fails before that first deploy, which creates the repository). On a project's first 2nd-gen deploy, Firebase may ask for IAM roles for Google's service agents (run the `gcloud` commands it prints, as an owner), and the Firestore trigger can fail while Eventarc's permissions spread: retry it after a few minutes. The functions run on the Blaze plan; a budget alert in Google Cloud Billing warns before costs grow.

Hosting (`firebase.json`) serves the prerendered pages as files and every other path `__spa-fallback.html`, without trailing slashes. Pages are sent with `Cache-Control: no-cache` and the hashed files in `/assets/` are cached for a year, so a deploy never leaves browsers with pages that point at deleted files.

The service worker (`public/sw.js`, registered in production builds only) caches the app shell, the public pages and the files they load, so the installed app starts offline. Pages are fetched from the network first, so an online visit always gets the latest deploy; Firebase and Firestore requests are not touched. To try the production build with these rules locally: `pnpm build && npx firebase-tools emulators:start --only hosting` (port 5000 is often taken on macOS; it moves to the next free one).

### Maintenance mode

For a deploy that could break the app while it runs (a data change, or rules that refuse what the running app writes), close the app first. In the [Firebase console](https://console.firebase.google.com/project/catat-saja/firestore), open the `config` collection and the `app` document (create them the first time) and set the fields below, or use `pnpm maintenance` (`scripts/maintenance.mjs`), which writes only the fields you name through Firestore's REST API with your `gcloud auth login`:

| Field           | Type      | What it does                                                                                                                                    |
| --------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `maintenance`   | boolean   | `true` shows the maintenance screen instead of the signed-in app and sign-in pages.                                                             |
| `message`       | string    | Optional: shown on that screen, under the standard text (in the language you write).                                                            |
| `until`         | timestamp | Optional: when it is expected to end, shown in each person's time.                                                                              |
| `minAppVersion` | number    | Optional: apps older than this (`appVersion` in `app/lib/constants/app-version.ts`) show "A new version is ready" with a Reload button instead. |

```sh
pnpm maintenance status
pnpm maintenance on --min-app-version 2 --message "Back in a few minutes" --until 2026-10-14T21:00+07:00
pnpm maintenance off
```

For a change to how data is stored, raise `appVersion` in the release and set `minAppVersion` to it when you turn maintenance off: maintenance alone lets a tab left open on the old app resume and write the old format.

Open apps switch at once, without a reload; the public pages (landing, About, How to use and the rest) stay up. Deploy, check the app, then set `maintenance` to `false`. Nobody can change `config` from the app (`firestore.rules`).

### Google Search Console

The production build groups shared icons, UI libraries and the small components used by public pages in `vite.config.ts` to reduce script requests. Feature modules keep their separate dynamic imports; avoid merging all shared code into one bundle, which pulls unused app features onto public pages.

`public/sitemap.xml` lists the six prerendered public pages. Keep it in step with `prerender` in `react-router.config.ts` when adding or removing a public page. `public/robots.txt` points crawlers to the sitemap and excludes sign-in and app paths from crawling.

In [Google Search Console](https://search.google.com/search-console), the `ardeman.com` Domain property covers this app's subdomain; verify it with Google's DNS TXT record. A URL-prefix property for `https://catatsaja.ardeman.com/` is also an option. After deploying these files, submit `https://catatsaja.ardeman.com/sitemap.xml` in **Sitemaps**. Use **URL Inspection** to check the homepage and request indexing. See [Google's setup guide](https://support.google.com/webmasters/answer/10267942).

## Project layout

```text
app/
  root.tsx            App shell: Firebase and theme providers, root layout, hydrate fallback
  routes.ts           Flat file routes plus a catch-all (catch-all.tsx)
  routes/             Route modules (thin: each renders one page component)
                        _layout._home.*   public pages (about, help, privacy, terms, changelog)
                        _layout.auth.*    sign in, sign up, forgot password
                        _layout._main.*   signed-in app (notes, tasks, finances, health, settings)
  apis/firestore/     Firestore reads and writes per collection (note, task, finance, health-log, user, currency)
  apis/ai/            Gemini calls through Firebase AI Logic (receipt, typed entries, note and task list helpers, dictation)
  apis/push.ts        This device's push subscription (Firebase Cloud Messaging)
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
public/               Icons (generated), site.webmanifest (generated), sw.js (offline start, push notifications), robots.txt, sitemap.xml
functions/            Cloud Functions (own pnpm workspace package, Node 24, asia-southeast2 beside Firestore) that send push notifications
scripts/              generate-manifest.mjs, generate-icons.mjs and the logo's vector master (icon/logo.svg)
firestore.rules       Security rules (owner and read/write permission lists)
firestore.indexes.json
```

## Documentation map

Each topic has one home. Update that file instead of copying its content somewhere else.

| File                                                                 | Audience                                         | Owns                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `README.md`                                                          | Everyone                                         | Objective, features, roadmap, setup, commands, deployment, layout |
| `AGENTS.md`                                                          | AI coding agents (and humans who want the rules) | Definition of done, conventions, guardrails, decisions            |
| `CLAUDE.md`, `GEMINI.md`                                             | Claude Code, Gemini CLI                          | Only an import of `AGENTS.md`                                     |
| `LICENSE`                                                            | Everyone                                         | Terms for using the code (MIT)                                    |
| `video_marketing.readme` in `external-projects.json` (separate repo) | Whoever makes the promo videos                   | Promo and stories videos, their scripts and uploads               |

Codex, Cursor, GitHub Copilot and other agents that follow the [AGENTS.md](https://agents.md) convention read `AGENTS.md` directly.

## Forking

Feel free to fork this repository. If you do, please give credit by linking back to [ardeman.com](https://ardeman.com/). Thank you!

## License

[MIT](LICENSE). Third-party packages keep their own licenses.
