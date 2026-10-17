This is a Turborepo monorepo (npm workspaces) for an Expo/React Native app that ships to Android, iOS and the web. Prioritize mobile-first patterns, performance, and cross-platform compatibility; the web version is used as much as mobile.

## Monorepo layout

- `apps/app` — the Expo app (`@meu-edital/app`). Paths below such as `src/app/` are relative to it.
- `packages/domain` — `@meu-edital/domain`: study models and rules (cycle, weight allocation, sessions, reviews, weekly tracking). Pure TypeScript: no React, React Native or Expo imports.
- `packages/agent-context` — `@meu-edital/agent-context`: the versioned `StudyContext` contract for external agents, tasks (`AgentTask`), change proposals and response validation. Depends only on the domain and Zod.
- `supabase/migrations` — database schema with RLS. Every table has `user_id` and an owner-only policy; add new tables the same way and update `apps/app/src/global/store/remoteSchema.ts`.
- Workspace packages are consumed as TypeScript source (`main: ./src/index.ts`); there is no build step.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

Run from the repository root unless noted:

```bash
npm run check               # lint, typecheck and tests of every workspace (Turborepo)
npm run web                 # start the app in the browser
npm run dev                 # start the Metro dev server
```

Inside `apps/app`:

```bash
npx expo install <package>  # ALWAYS use instead of npm add for the app — resolves SDK-compatible versions
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Dependencies of `packages/*` are plain npm dependencies (`npm install <pkg> --workspace=@meu-edital/domain`). Run `npm run check` before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Feature-based structure

- Organize code by functionality in `src/features/<feature>/`. Keep each feature self-contained and expose its screen through `index.ts`; route files in `src/app/` should only connect the route to that public entry point.
- Add folders only when needed: `components/` for feature UI, `hooks/` for feature state, `services/` for integrations and workflows, `utils/` for pure helpers, `schemas/` or `types/` for feature data contracts, and `constants/` for feature values. Do not create empty folders or a generic `logic/` package.
- Put code used by multiple features in `src/global/`: reusable UI in `components/`, shared state in `store/`, helpers in `utils/`, and app-wide values in `constants/`. Keep study models and calculations in `packages/domain` and everything agents read or propose in `packages/agent-context`; screens call them instead of reimplementing rules. Keep static assets in `assets/` according to `app.json` references.
- Features must not import another feature's internal files. Communicate through the feature's `index.ts` public API, shared state, or shared domain code. Use relative imports within a feature, the `@features/*` and `@global/*` aliases across app boundaries (`apps/app/tsconfig.json`), and the `@meu-edital/*` package names for shared packages.
- Group external imports before internal imports. Name React components in PascalCase; name helpers and services descriptively in camelCase, and assets in kebab-case. Extract repeated code into shared modules only when it is genuinely shared.
- Route groups `(name)` organize routes without changing URLs; `[param]` denotes a dynamic route. Add them only when the navigation needs them.

Reference: https://ahmad2point0.medium.com/react-app-feature-based-folder-structure-guide-848ddc7447d5

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- Study is cyclic: the cycle (`CycleItem` = subject + minutes) is the source of "what to study next"; there is no day-by-day weekly plan. The topic is chosen per session (`suggestNextTopic`).
- External AI output is untrusted data: validate it with the task's Zod schema, show a preview, and apply only after the user confirms. Never write agent output directly to storage.
- `StudyContext` is a public contract: use readable names, not ids, and bump `STUDY_CONTEXT_VERSION` on breaking changes.
- If `apps/app/ios/` and `apps/app/android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins. Hand-written native code belongs in local Expo modules under `apps/app/modules`.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
