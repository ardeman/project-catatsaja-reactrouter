# AGENTS.md

Instructions for AI coding agents working in this repo. Read `README.md` for the overview, setup, commands and layout. This file does not repeat them.

## Definition of done

A change is done only when the **Checks** command in `README.md` passes. If you can't run it, say so; don't claim it passed. There are no automated tests yet, so for UI changes also look at the result in `pnpm dev`, in both light and dark mode and both languages.

## Conventions

- Use Conventional Commit subjects; see `README.md` for the format and hooks.
- Fix ESLint and knip findings; don't silence them with `eslint-disable` or knip ignores unless you add a comment saying why.
- Import app code through the `~/` alias (`~/lib/...`, `~/components/...`), not relative paths that climb out of a folder.
- Files and folders use `kebab-case`. Components are arrow functions with named exports; only route modules use a default export.
- Route modules in `app/routes/` stay thin: they render one component from `app/components/pages/<page>/` and hold no logic.
- A page folder has `index.tsx` (the exported page), and as needed a `context.tsx` for page state, a `type.ts` for its prop types, and one file per part. Files that touch browser-only APIs end in `.client.tsx`.
- Firestore calls live only in `app/apis/firestore/<collection>.ts`. Components reach data through one hook per action in `app/lib/hooks/` (`use-get-*`, `use-create-*`, `use-update-*`, `use-delete-*`); never call Firestore from a component.
- Types go in `app/lib/types/<domain>.ts` with a `T` prefix (`TNoteResponse`, `TCreateNoteRequest`); Zod schemas go in `app/lib/validations/<domain>.ts`.
- Zod 4 style: pass messages as `{ error: t(...) }` (not `message`), and use top-level formats such as `z.email()`. A schema that coerces (`z.coerce`) has a different input type, so its form uses `useForm<z.input<...>, unknown, z.output<...>>`.
- Notes and tasks are shared through `permissions.read` and `permissions.write` lists of user ids; `owner` is the creator. Keep queries, writes and `firestore.rules` consistent with each other.
- `app/components/ui/` holds generated shadcn/ui primitives: add them with the shadcn CLI and don't restyle them in place. App-specific variants go in `app/components/base/`.
- Style with Tailwind classes and `cn()` (`~/lib/utils/shadcn`); colors come from the CSS variables in `app/styles/`, so both themes work.
- Tailwind 4 is configured in CSS only: theme, plugins and the `dark` variant live in `app/styles/tailwind.css`. Don't add a `tailwind.config.*` or `postcss.config.*`. Other CSS files that use theme values start with `@reference './tailwind.css'` and use `--theme(...)`.
- Tailwind 4's `space-y-*` adds a bottom margin, which does nothing on an inline element such as a `<label>`. For a stack that starts with a label, use `[&>:not([hidden])~:not([hidden])]:mt-*` (the v3 rule, as in `app/components/base/input/`); elsewhere prefer `flex`/`grid` with `gap-*`.
- User-facing text goes in both `app/localization/locales/en/` and `id/` (`common.json`, validation messages in `zod.json`); never hardcode strings.
- Read environment variables only through `app/lib/utils/environment.ts`.

## Guardrails

- **Dependencies:** add packages with `pnpm add` (not by editing versions by hand) and commit `pnpm-lock.yaml`. knip fails on unused dependencies, so remove what you stop using. Never relax pnpm's `minimumReleaseAge` or approve a package in `allowBuilds` (`pnpm-workspace.yaml`) without the user's approval; when a package asks to run an install script, say what the script does.
- **Firestore rules:** any new collection, field used for access or query needs matching rules in `firestore.rules` (and an index in `firestore.indexes.json` if the query needs one). Never loosen a rule to make a feature work.
- **Deployment:** pushing to `main` deploys to production. Commit and push only when asked. Deploying Firestore (`firebase deploy`) or setting repository secrets needs the user's explicit approval.
- **Secrets:** never commit `.env`, API keys or service account files. A new variable goes in `.env.example`, `environment.ts`, the workflow's build `env` and the README's environment table.
- **Generated files:** don't edit `public/site.webmanifest` (change `app/lib/constants/metadata.ts`), `.react-router/` or `build/`.

## Keeping docs current

- When you change a command, the layout, the setup or deployment, update `README.md`. When you change a convention or rule, update this file.
- Never copy content between docs. Link to the owning file instead (see the documentation map in `README.md`).
- `CLAUDE.md` and `GEMINI.md` must contain only the import of this file.

## Decisions

Record architectural choices here as one line each: date, decision, reason.

- 2026-10-09: Single-page app (`ssr: false`) on Firebase Hosting, with every path rewritten to `index.html`, so no server is needed.
- 2026-10-09: Firestore data is read with live `onSnapshot` listeners inside hooks, not a query cache library, so shared notes and tasks update in real time.
- 2026-10-09: Node 24 LTS and pnpm 12 (through Corepack). React Router 8 and lint-staged 17 need Node 22.22 or later; pnpm 12 refuses releases younger than a day and runs no dependency install scripts unless allowed. The three that ask (`@firebase/util`, `protobufjs`, `unrs-resolver`) are denied: none is needed for this app.
- 2026-10-09: `remix-i18next` removed. Version 8 only offers a server middleware, and this app renders on the server only at build time, so `app/localization/i18next.server.ts` reads the language cookie and the routes' `handle.i18n` itself.
- 2026-10-09: Tailwind 4 with `@tailwindcss/vite` and a CSS-only config, `tw-animate-css` instead of `tailwindcss-animate`, and Vite's own `resolve.tsconfigPaths` instead of `vite-tsconfig-paths`. Checked against production: public pages match pixel for pixel in both themes, apart from icons lucide redrew.
- 2026-10-09: ESLint 10, because every ESLint 9 release is deprecated. `eslint-plugin-react`, `-import` and `-jsx-a11y` don't support it yet and run through `@eslint/compat`; the rules newer unicorn and react-hooks versions added are off until the code is migrated (README → Roadmap).
- 2026-10-09: TypeScript stays on 6.0: typescript-eslint supports only versions below 6.1.
