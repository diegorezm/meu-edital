# AGENTS.md

How to work on this codebase. For what the app is and does (concepts, screens, product rules), read [README.md](README.md) first.

## Project at a glance

Turborepo monorepo (npm workspaces) for an Expo/React Native app that ships to Android, iOS and the web. The web version is used as much as mobile: every screen must work on a phone and in a desktop browser.

| Path | Package | What goes there |
| --- | --- | --- |
| `apps/app` | `@meu-edital/app` | Expo app: routes, screens, UI, store, sync, native module. |
| `packages/domain` | `@meu-edital/domain` | Study models and rules: cycle, weight allocation, sessions, reviews, weekly tracking, catalog removal. |
| `packages/agent-context` | `@meu-edital/agent-context` | `StudyContext` contract, agent tasks, change proposals, response parsing. |
| `supabase/migrations` | — | Database schema and RLS policies. |

Workspace packages are consumed as TypeScript source (`main: ./src/index.ts`). There is no build step.

## Commands

Use `bunx` instead of `npx` if a `bun.lock` appears. Run from the repository root unless noted.

```bash
npm run check               # lint + typecheck + tests in every workspace (Turborepo)
npm run web                 # app in the browser (local mode without Supabase env)
npm run dev                 # Metro dev server for the development build
npm run build:web           # export the web SPA to apps/app/dist
```

Inside `apps/app`:

```bash
npx expo install <package>  # ALWAYS use this to add app dependencies (SDK-compatible versions)
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible versions
```

Dependencies of `packages/*` are plain npm dependencies: `npm install <pkg> --workspace=@meu-edital/domain`.

**Definition of done:** `npm run check` passes. For UI changes, also open the screen with `npm run web` and check both a phone width (< 760 px) and a desktop width.

## Where code goes

Decide by what the code depends on:

1. **Pure study logic** (no React, React Native or Expo imports) → `packages/domain`. Screens call these functions; they never reimplement rules.
2. **Anything an external agent reads, returns or proposes** → `packages/agent-context`. It depends only on the domain and Zod.
3. **App code** → `apps/app/src`:
   - `app/` — Expo Router routes only. Each route file re-exports a feature: `export { default } from "@features/semana";`.
   - `features/<feature>/` — one folder per screen, public entry in `index.ts`. Add `components/`, `hooks/`, `services/`, `utils/`, `schemas/`, `constants/` only when needed. No empty folders, no generic `logic/`.
   - `global/` — shared by several features: `components/` (UI kit in `ui.tsx`), `store/` (auth, store, repository, sync), `services/` (Supabase client), `utils/`, `constants/`.
4. **Hand-written native code** → local Expo module in `apps/app/modules` (see `study-timer`).

Import rules:

- A feature never imports another feature's internals. Share through domain, `global/` or the feature's `index.ts`.
- Relative imports inside a feature; `@features/*` and `@global/*` aliases across the app; `@meu-edital/domain` and `@meu-edital/agent-context` for packages.
- External imports first, then internal ones. Components in PascalCase, helpers and services in camelCase, assets in kebab-case.

## Domain rules (do not break)

- **Study is cyclic.** `CycleItem` is subject + minutes. The cycle is the only source of "what to study next". There is no day-by-day plan; do not add one back.
- The topic is chosen per session. Use `suggestNextTopic`: first unstudied topic in syllabus order, then the one studied longest ago.
- `recordSession` is the only way to save a study session. It marks the topic studied, schedules reviews, completes due reviews on a review session and advances the cycle when `cycleItemId` is set.
- One cycle lap equals the weekly target (`weeklyAllocation`). Change allocation rules only with tests.
- Dates are local `YYYY-MM-DD` strings (`today`, `addDays`, `weekStartOf`). Never use `toISOString()` for dates: it shifts the day in Brazil's time zone.
- Ids come from `uid()`. Their alphabetical order is creation order; the sync relies on it to keep syllabus order.
- Domain functions are pure: `(data: AppData, ...) => AppData`. No mutation, no I/O.

## External agents (`packages/agent-context`)

- Agent output is **untrusted data**. Parse it with the task's Zod schema (`parseTaskResponse`), show a preview (`previewChanges`) and apply only after the user confirms. Never write agent output straight to storage.
- `StudyContext` is a public, versioned contract. Use readable names, never ids. Breaking changes bump `STUDY_CONTEXT_VERSION`; additive optional fields do not.
- A new agent capability is a new `AgentTask` (instructions + context slice + response schema + example) or a new `ChangeSchema` operation with a matching case in `previewChanges` and `applyChanges`. Add a test for each.
- Keep the transport separate: `renderPrompt` for copy and paste, `taskRequest` for API or MCP use. Do not add a paid AI API call to the app.

## Data, sync and Supabase

The store (`global/store/store.tsx`) keeps `AppData` in memory. Screens change it only through `update(current => next)` with domain functions. The repository saves it:

- **Local mode** (no `EXPO_PUBLIC_SUPABASE_*` env): AsyncStorage, demo seed on first run.
- **Remote mode:** device cache + outbox of `SyncOp`s computed by `diffData(prev, next)`. Upserts go parents first and deletes children first, to respect foreign keys.

To add or change a persisted field:

1. Change the type in `packages/domain/src/types.ts`.
2. Add a **new** migration in `supabase/migrations` (`YYYYMMDDHHMMSS_description.sql`). Never edit a migration that may already be applied.
3. Update `toRow` and `fromRow` in `apps/app/src/global/store/remoteSchema.ts`.
4. Run the round-trip test in `apps/app/tests/sync.test.ts`.

Every new table has `user_id uuid default auth.uid()`, RLS enabled, the owner-only policy and grants to `authenticated`, like the existing ones. Never ship a table without RLS. The publishable key is public by design; RLS is the protection.

## UI conventions

- Build screens with the kit in `global/components/ui.tsx`: `Page`, `Section`, `Button`, `Field`, `BottomSheet`, `BottomDrawer`, `Empty`, `InlineLink`. Colors come from `palette` (`global/constants/colors.ts`).
- Layout switches at `width < 760` (mobile: top bar + bottom nav; desktop: sidebar). Content columns use a `maxWidth` around 680–760 and `alignSelf: "center"`.
- All user-facing text is in Brazilian Portuguese, short and friendly. Follow the language of the file you are in for comments.
- Keep animation minimal. Format time with `formatDuration` and dates with `formatShortDate`.
- Platform-specific code uses file suffixes (`.native.tsx`, `.android.ts`) next to a web-safe default file.

## Expo: check the docs, not your memory

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS or React Native API:

1. Read the `expo` major version in `apps/app/package.json`.
2. Read the versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`.
3. For anything else, start at https://docs.expo.dev/llms.txt and follow its links.

Rules:

- Navigation is Expo Router only. Import `Link`, `router` and `useLocalSearchParams` from `expo-router`. Docs: https://docs.expo.dev/router/introduction.md
- `apps/app/ios` and `apps/app/android` are generated (Continuous Native Generation). Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only has its bundled native modules. A new native dependency needs a development build (`npx expo run:android|ios` or `npx eas-cli@latest build --profile development`).
- Prefer Expo modules over third-party libraries, and check your available skills before adding a dependency.
- The web build is a SPA (`web.output: "single"`), deployed with `npm run deploy:web` to EAS Hosting. `EXPO_PUBLIC_*` variables are inlined at build time.
- Run EAS CLI as `npx eas-cli@latest <command>` (or `bunx eas-cli` in Bun projects). Docs: https://docs.expo.dev/eas/index.md

## Tests

- Node's test runner via `tsx`: each workspace has `tests/*.test.ts`, run by `npm run check` (or `npm test --workspace=<name>`).
- Domain and agent-context changes need tests. Test pure functions; build data with `createSeed()` and adjust it.
- Tests must not import React Native. Keep logic you want to test out of components.

## Git

- Work on a branch, not on `main`. Commit only when asked.
- Commit messages in Portuguese, present tense, third person, describing the change: `Adiciona cronômetro persistente com notificação no Android`.
- Never commit `.env.local`, generated native folders, `dist/` or `.turbo/`.
