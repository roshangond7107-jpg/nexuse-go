# NEXUSE GO
Marketplace for second-hand study items. Monorepo: `apps/web` (Next.js), `apps/mobile` (Expo, Android), shared `packages/*`.

## First-time setup
1. `corepack enable && pnpm install` (commit the generated `pnpm-lock.yaml`; or run the `generate-lockfile` workflow)
2. `pnpm test` — real vitest across packages
3. `pnpm --filter @nexuse/web dev` — web on http://localhost:3000
4. `cd apps/mobile && npx expo install --fix && pnpm android`

Status of each piece (what has and hasn't been executed): `docs/completion-checklist.md`.
