<h1 align="center">
  project-catatsaja-reactrouter
</h1>

<p align="center">
  <a href="https://github.com/ardeman/project-catatsaja-reactrouter/actions/workflows/firebase-remix.yml" target="_blank">
    <img src="https://github.com/ardeman/project-catatsaja-reactrouter/actions/workflows/firebase-remix.yml/badge.svg?branch=main" alt="Deployment Status" />
  </a>
</p>

Catat Saja is a web app for notes, tasks and finances, in English and Bahasa Indonesia. Notes and tasks can be pinned and shared with other users; finances use currencies the user sets up, with their own formatting.

It is a React Router 7 single-page app (`ssr: false`) backed by Firebase Auth and Cloud Firestore, and hosted on Firebase Hosting.

| Item             | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Node.js          | 22.11.0 (`.nvmrc`; `engines` allows >= 20)                  |
| Package manager  | pnpm 9.14.4 (`packageManager` in `package.json`)            |
| UI               | Tailwind CSS 3, shadcn/ui (`new-york`, Radix), lucide icons |
| Forms            | react-hook-form + zod                                       |
| i18n             | i18next / remix-i18next, languages `en` and `id`            |
| Firebase project | `catat-saja`                                                |

## Getting started

Prerequisites: Node.js and pnpm at the versions above, and [firebase-tools](https://firebase.google.com/docs/cli) (v13 or later).

```sh
git clone https://github.com/ardeman/project-catatsaja-reactrouter.git
cd project-catatsaja-reactrouter
pnpm install           # also installs the Husky Git hooks
cp .env.example .env   # then fill in the values below
firebase login
firebase deploy --only firestore   # rules and indexes
pnpm dev               # http://localhost:5173
```

### Environment variables

`.env` is git-ignored. In CI the same names come from repository secrets.

| Variable                | Used for                                                       |
| ----------------------- | -------------------------------------------------------------- |
| `VITE_FIREBASE_*`       | Firebase web app config (Project settings → Your apps)         |
| `VITE_GRAVATAR_API_KEY` | Profile avatars from Gravatar                                  |
| `VITE_GEMINI_API_KEY`   | Gemini API (passed to the build; not read by the app code yet) |

Variables are read in one place, `app/lib/utils/environment.ts`.

## Commands

| Task                                                                      | Command                            |
| ------------------------------------------------------------------------- | ---------------------------------- |
| Install dependencies                                                      | `pnpm install`                     |
| Dev server                                                                | `pnpm dev`                         |
| Lint                                                                      | `pnpm lint`                        |
| Typecheck (generates route types first)                                   | `pnpm typecheck`                   |
| Unused files, exports and dependencies                                    | `pnpm knip`                        |
| Format                                                                    | `pnpm format`                      |
| Regenerate `public/site.webmanifest` from `app/lib/constants/metadata.ts` | `pnpm generate:manifest`           |
| Production build (includes the manifest)                                  | `pnpm build`                       |
| Preview the production build                                              | `pnpm preview`                     |
| Deploy Firestore rules and indexes                                        | `firebase deploy --only firestore` |
| Reinstall Git hooks                                                       | `pnpm prepare`                     |

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

## Project layout

```text
app/
  root.tsx            App shell: Firebase and theme providers, root layout, hydrate fallback
  routes.ts           Flat file routes plus a catch-all (catch-all.tsx)
  routes/             Route modules (thin: each renders one page component)
                        _layout._home.*   public pages (about, privacy, terms)
                        _layout.auth.*    sign in, sign up, forgot password
                        _layout._main.*   signed-in app (notes, tasks, finances, settings)
  apis/firestore/     Firestore reads and writes per collection (note, task, user, currency)
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
  localization/       i18next setup; locales/<en|id>/common.json and zod.json
  styles/             Tailwind and global CSS, Milkdown editor theme
public/               Icons and site.webmanifest (generated)
scripts/              generate-manifest.mjs
firestore.rules       Security rules (owner and read/write permission lists)
firestore.indexes.json
```

## Documentation map

Each topic has one home. Update that file instead of copying its content somewhere else.

| File                     | Audience                                         | Owns                                                       |
| ------------------------ | ------------------------------------------------ | ---------------------------------------------------------- |
| `README.md`              | Everyone                                         | Overview, setup, environment, commands, deployment, layout |
| `AGENTS.md`              | AI coding agents (and humans who want the rules) | Definition of done, conventions, guardrails, decisions     |
| `CLAUDE.md`, `GEMINI.md` | Claude Code, Gemini CLI                          | Only an import of `AGENTS.md`                              |
| `LICENSE`                | Everyone                                         | Terms for using the code (MIT)                             |

Codex, Cursor, GitHub Copilot and other agents that follow the [AGENTS.md](https://agents.md) convention read `AGENTS.md` directly.

## Forking

Feel free to fork this repository. If you do, please give credit by linking back to [ardeman.com](https://ardeman.com/). Thank you!

## License

[MIT](LICENSE). Third-party packages keep their own licenses.
