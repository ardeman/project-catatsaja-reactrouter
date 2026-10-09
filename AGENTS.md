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
- Notes, tasks and finances are shared through `permissions.read` and `permissions.write` lists of user ids; `owner` is the creator. Keep queries, writes and `firestore.rules` consistent with each other: an update must match one of the cases in `canUpdateShared` (owner, a writer changing the content fields, anyone pinning for themselves, a reader leaving). A new content field goes in that collection's list in the rules.
- Only content edits set `updatedAt`. Pinning, sharing and leaving must not, or they change the "edited" date and the list order.
- A list page renders `Collection` (`app/components/base/collection`): loading and empty states, pinned and other sections, newest first, and the navbar search (`?q=`). Cards open through a link that covers the card (see `notes/card.tsx`), and masonry cards are `w-full sm:w-80`.
- A detail form saves with `useAutosave` and a `save()` that writes only what differs from the stored document, so it can run any time (idle, leaving, the Save button). New items are created when leaving with content, never discarded behind a prompt. Show `SaveStatus` next to the date, and lock every input for read-only users.
- Show Firebase errors with `getErrorMessage` (`app/lib/utils/firebase-error.ts`), never `String(error)`; add new codes to its map and to `errors.*` in both languages.
- Icon-only buttons need an `aria-label` and a `title` from the translations. Toasts can't be reached while a modal dialog is open, so an undo inside a dialog goes in the dialog.
- `app/components/ui/` holds generated shadcn/ui primitives: add them with the shadcn CLI and don't restyle them in place. App-specific variants go in `app/components/base/`.
- Style with Tailwind classes and `cn()` (`~/lib/utils/shadcn`); colors come from the CSS variables in `app/styles/`, so both themes work.
- Tailwind 4 is configured in CSS only: theme, plugins and the `dark` variant live in `app/styles/tailwind.css`. Don't add a `tailwind.config.*` or `postcss.config.*`. Other CSS files that use theme values start with `@reference './tailwind.css'` and use `--theme(...)`.
- Tailwind 4's `space-y-*` adds a bottom margin, which does nothing on an inline element such as a `<label>`. For a stack that starts with a label, use `[&>:not([hidden])~:not([hidden])]:mt-*` (the v3 rule, as in `app/components/base/input/`); elsewhere prefer `flex`/`grid` with `gap-*`.
- User-facing text goes in both `app/localization/locales/en/` and `id/` (`common.json`, validation messages in `zod.json`); never hardcode strings.
- Read environment variables only through `app/lib/utils/environment.ts`.
- Public pages (`publicPages` in `app/lib/configs/page.ts`, and `prerender` in `react-router.config.ts`) are rendered at build time in English and must not wait for Firebase Auth or touch browser APIs (`window`, `localStorage`, `document`) while rendering; do that in effects. A new public page goes in both lists.

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
- 2026-10-09: Firestore rules check each kind of update on shared documents separately. Before, anyone with read access could write, so read-only sharing was not enforced.
- 2026-10-09: The share dialog loads only the profiles of the people an item is shared with (by id, 30 per query). It used to read the whole `users` collection.
- 2026-10-09: Sign-up writes the profile before sending the verification email, and signing in recreates a missing profile: a failed email had left accounts without one, unable to create anything or be found for sharing.
- 2026-10-09: The landing page and the other public pages are prerendered (React Router `prerender` with `ssr: false`) so search engines and link previews can read them; everything else stays client-only via `__spa-fallback.html`. They hydrate in the build language and then switch to the saved one (`app/entry.client.tsx`), so the text matches during hydration; an inline script applies the saved theme before the first paint.
- 2026-10-09: Hosting sends pages with `Cache-Control: no-cache` and `/assets/` as immutable for a year. With Firebase's default one-hour caching, a deploy left browsers with cached pages pointing at deleted asset files.
