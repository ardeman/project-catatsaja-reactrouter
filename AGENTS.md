# AGENTS.md

Instructions for AI coding agents working in this repo. Read `README.md` for the overview, setup, commands and layout. This file does not repeat them.

## Definition of done

A change is done only when the **Checks** command in `README.md` passes. If you can't run it, say so; don't claim it passed. The Firestore rules have tests (`pnpm test:rules`) and encryption and sharing have end-to-end tests (`pnpm test:e2e`), both run before every deploy; extend `tests/e2e/` when you change how items are stored, shared or unlocked. Other UI has no tests yet, so for UI changes also look at the result in `pnpm dev`, in both light and dark mode and both languages.

## Conventions

- Keep independent end-to-end scenarios out of the dependent Ana/Budi/Cici sequence in `tests/e2e/encryption.test.mjs`. Each independent scenario creates its own accounts. A new suite must be listed in both the workflow's `e2e` matrix and `pnpm test:e2e`. Update the suite descriptions in `README.md`, which owns the commands and execution layout.
- Use Conventional Commit subjects; see `README.md` for the format and hooks.
- Fix ESLint and knip findings; don't silence them with `eslint-disable` or knip ignores unless you add a comment saying why.
- Import app code through the `~/` alias (`~/lib/...`, `~/components/...`), not relative paths that climb out of a folder.
- Files and folders use `kebab-case`. Components are arrow functions with named exports; only route modules use a default export.
- Route modules in `app/routes/` stay thin: they render one component from `app/components/pages/<page>/` and hold no logic.
- A page folder has `index.tsx` (the exported page), and as needed a `context.tsx` for page state, a `type.ts` for its prop types, and one file per part. Files that touch browser-only APIs end in `.client.tsx`.
- Firestore calls live only in `app/apis/firestore/<collection>.ts`. Components reach data through one hook per action in `app/lib/hooks/` (`use-get-*`, `use-create-*`, `use-update-*`, `use-delete-*`); never call Firestore from a component.
- Types go in `app/lib/types/<domain>.ts` with a `T` prefix (`TNoteResponse`, `TCreateNoteRequest`); Zod schemas go in `app/lib/validations/<domain>.ts`.
- Zod 4 style: pass messages as `{ error: t(...) }` (not `message`), and use top-level formats such as `z.email()`. A schema that coerces (`z.coerce`) has a different input type, so its form uses `useForm<z.input<...>, unknown, z.output<...>>`.
- Show Firebase errors with `getErrorMessage` (`app/lib/utils/firebase-error.ts`), never `String(error)`; add new codes to its map and to `errors.*` in both languages.
- Icon-only buttons need an `aria-label` and a `title` from the translations. Toasts can't be reached while a modal dialog is open, so an undo inside a dialog goes in the dialog.
- `app/components/ui/` holds generated shadcn/ui primitives: add them with the shadcn CLI and don't restyle them in place. App-specific variants go in `app/components/base/`.
- Style with Tailwind classes and `cn()` (`~/lib/utils/shadcn`); colors come from the CSS variables in `app/styles/`, so both themes work.
- User-facing text goes in both `app/localization/locales/en/` and `id/` (`common.json`, validation messages in `zod.json`); never hardcode strings.
- When a change people can notice is released, add it to `app/content/changelog.ts` in both languages: plain words about what changed for them, tagged new, improved or fixed. Group changes released together under one date.
- Read environment variables only through `app/lib/utils/environment.ts`.

## Guardrails

- **Dependencies:** add packages with `pnpm add` (not by editing versions by hand) and commit `pnpm-lock.yaml`. knip fails on unused dependencies, so remove what you stop using. Never relax pnpm's `minimumReleaseAge` or approve a package in `allowBuilds` (`pnpm-workspace.yaml`) without the user's approval; when a package asks to run an install script, say what the script does.
- **Firestore rules:** any new collection, field used for access or query needs matching rules in `firestore.rules` (and an index in `firestore.indexes.json` if the query needs one). Never loosen a rule to make a feature work. Change `tests/firestore-rules.test.mjs` with the rules: a new collection gets its own cases, and what must be refused is tested as well as what is allowed.
- **Deployment:** pushing to `main` deploys to production. Before a deploy that could break the running app (changing stored data, or rules that refuse what the deployed app writes), suggest turning on maintenance mode first (README → Deployment → Maintenance mode), and turning it off after checking. A change to how data is stored also raises `appVersion` (`app/lib/constants/app-version.ts`) so tabs left open on the old app are asked to reload (`minAppVersion`, same section). Commit and push only when asked. Deploying Firestore or the Cloud Functions (`firebase deploy`) or setting repository secrets needs the user's explicit approval.
- **Secrets:** never commit `.env`, API keys or service account files. A new variable goes in `.env.example`, `environment.ts`, the workflow's build `env` and the README's environment table.
- **Generated files:** don't edit `public/site.webmanifest` (change `app/lib/constants/metadata.ts`), the icons in `public/` (change `scripts/icon/logo.svg` and run `pnpm generate:icons`), `.react-router/` or `build/`.

## Area guides

Read the guide for the area you work on before changing it:

- `docs/sharing-and-encryption.md`: sharing, invites, encrypted content fields, `updatedAt`.
- `docs/ui-patterns.md`: list pages, detail forms and autosave, glass surfaces, Tailwind 4.
- `docs/installed-app.md`: public pages, `public/sw.js`, theme before first paint, the installed app and manifest.
- `docs/ai-features.md`: Gemini features.
- `docs/marketing-videos.md`: the promo and stories videos (a separate repo).
- `docs/decisions.md`: past architectural choices and their reasons; add a line there for a new one.

## Keeping docs current

- When you change a command, the layout, the setup or deployment, update `README.md`. When you change a convention or rule, update this file or the `docs/` guide that owns it.
- Never copy content between docs. Link to the owning file instead (see the documentation map in `README.md`).
- `CLAUDE.md` and `GEMINI.md` must contain only the import of this file.
