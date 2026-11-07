# NEXUSE GO — Technical Handover Report

Generated 2026-11-07 by inspecting the project as it exists on disk. **Nothing else in the project was modified to produce this report** (only this file was added). Statuses use: ✅ verified by execution · 🟡 partially verified · 📝 written, never executed · ⬜ not started · ❌ known broken.

> **UPDATE (later the same day):** after this report was first written, the RLS test suite was repaired and now passes **116/116** locally (emulated Supabase; mutation-checked), `PROJECT_STATUS.md`, `CHANGELOG.md`, `NEXT_STEPS.md` and `docs/compliance-checklist.md` were added, a coming-soon communities display was added to web/mobile, and three small bugs were fixed. Where this report says the RLS suite is failing/invalid or docs are missing, read it as superseded by `PROJECT_STATUS.md`. Everything else (no lockfile, apps never built, no auth/backend) is unchanged.

## 0. Read this first (honest summary)
- Project = pnpm/Turborepo monorepo: Next.js web (`apps/web`), Expo Android (`apps/mobile`), 4 shared TS packages, and a Supabase SQL layer (`supabase/`).
- **It is a front-end preview with no working backend.** No listing can be created, no user can sign in, no message can be sent. Every listing request returns "not connected" by design.
- Development happened in 3 batches inside a **network-less sandbox**: `pnpm install` was never run, no `pnpm-lock.yaml` exists, `next build` / `expo` were never run, apps were never type-checked or opened.
- **Batch 3 is incomplete** (stopped mid-way): community architecture in shared code is done and tested; SQL migrations are written and apply cleanly, but the **RLS test suite is currently invalid/failing (84 pass / 38 fail)** and no security claim can be made yet.
- Not yet created despite the master prompt asking for them: `PROJECT_STATUS.md`, `CHANGELOG.md`, `NEXT_STEPS.md`, legal/privacy compliance checklist (this report partly covers status; the others are TODO).
- A previously delivered ZIP (end of Batch 2) does **not** contain Batch 3 work; the ZIP delivered with this report does.

## 1. Folder and file tree
(`node_modules`, build output excluded; a throwaway `node_modules` exists locally from the test harness and is NOT shipped.)
```
.env.example
.github/workflows/ci.yml
.github/workflows/generate-lockfile.yml
.gitignore
.npmrc
.nvmrc
README.md
apps/mobile/.gitignore
apps/mobile/app.json
apps/mobile/app/(tabs)/_layout.tsx
apps/mobile/app/(tabs)/account.tsx
apps/mobile/app/(tabs)/categories.tsx
apps/mobile/app/(tabs)/index.tsx
apps/mobile/app/(tabs)/sell.tsx
apps/mobile/app/(tabs)/wishlist.tsx
apps/mobile/app/_layout.tsx
apps/mobile/app/category/[slug].tsx
apps/mobile/app/product/[id].tsx
apps/mobile/app/search.tsx
apps/mobile/assets/adaptive-icon.png
apps/mobile/assets/icon.png
apps/mobile/assets/splash.png
apps/mobile/babel.config.js
apps/mobile/components/ListingsList.tsx
apps/mobile/components/OfflineBanner.tsx
apps/mobile/components/ProductCard.tsx
apps/mobile/components/Screen.tsx
apps/mobile/components/SearchBar.tsx
apps/mobile/components/States.tsx
apps/mobile/components/ui.tsx
apps/mobile/expo-env.d.ts
apps/mobile/lib/repository.ts
apps/mobile/lib/theme.tsx
apps/mobile/lib/useListings.ts
apps/mobile/lib/useOnline.ts
apps/mobile/lib/wishlist.tsx
apps/mobile/metro.config.js
apps/mobile/package.json
apps/mobile/tsconfig.json
apps/web/.gitignore
apps/web/app/account/page.tsx
apps/web/app/account/sign-in/page.tsx
apps/web/app/categories/page.tsx
apps/web/app/category/[slug]/page.tsx
apps/web/app/error.tsx
apps/web/app/globals.css
apps/web/app/icon.svg
apps/web/app/layout.tsx
apps/web/app/loading.tsx
apps/web/app/not-found.tsx
apps/web/app/page.tsx
apps/web/app/product/[id]/page.tsx
apps/web/app/safety/page.tsx
apps/web/app/search/page.tsx
apps/web/app/sell/page.tsx
apps/web/app/wishlist/page.tsx
apps/web/components/FilterForm.tsx
apps/web/components/Footer.tsx
apps/web/components/Header.tsx
apps/web/components/Logo.tsx
apps/web/components/OfflineBanner.tsx
apps/web/components/Pagination.tsx
apps/web/components/ProductCard.tsx
apps/web/components/ProductGrid.tsx
apps/web/components/Results.tsx
apps/web/components/SellForm.tsx
apps/web/components/States.tsx
apps/web/components/WishlistButton.tsx
apps/web/components/WishlistView.tsx
apps/web/lib/repository.ts
apps/web/lib/wishlist-store.ts
apps/web/next-env.d.ts
apps/web/next.config.mjs
apps/web/package.json
apps/web/public/logo.svg
apps/web/tsconfig.json
docs/HANDOVER-REPORT.md
docs/completion-checklist.md
package.json
packages/catalog/package.json
packages/catalog/src/catalog.test.ts
packages/catalog/src/categories.ts
packages/catalog/src/communities.ts
packages/catalog/src/format.ts
packages/catalog/src/index.ts
packages/catalog/src/loadable.ts
packages/catalog/src/query.ts
packages/catalog/src/repository.ts
packages/catalog/src/testing/memory-repository.ts
packages/catalog/src/types.ts
packages/catalog/src/wishlist.ts
packages/catalog/tsconfig.json
packages/domain/package.json
packages/domain/src/age.ts
packages/domain/src/commission.ts
packages/domain/src/domain.test.ts
packages/domain/src/index.ts
packages/domain/src/pricing.ts
packages/domain/src/prohibited.ts
packages/domain/src/providers.ts
packages/domain/src/roles.ts
packages/domain/src/status.ts
packages/domain/tsconfig.json
packages/tokens/package.json
packages/tokens/src/index.ts
packages/tokens/src/tokens.test.ts
packages/tokens/tsconfig.json
packages/validation/package.json
packages/validation/src/index.ts
packages/validation/src/validation.test.ts
packages/validation/tsconfig.json
pnpm-workspace.yaml
scripts/check-secrets.sh
scripts/generate-seed.ts
supabase/migrations/0001_core_schema.sql
supabase/migrations/0002_security_rls.sql
supabase/migrations/0003_storage.sql
supabase/seed.sql
supabase/tests/00_supabase_shim.sql
supabase/tests/rls_tests.sql
supabase/tests/run.sh
tsconfig.base.json
turbo.json
```
Size: ~2,200 lines of TS/TSX plus ~600 lines of SQL.

## 2. Packages and versions
**Pinned from memory — NOT verified against the npm registry. No lockfile exists.**

| Workspace | Dependency | Version |
|---|---|---|
| root | turbo / typescript / tsx | 2.3.3 / 5.6.3 / 4.19.2 ; packageManager pnpm@9.15.0 ; Node `.nvmrc` 20.11.0 |
| @nexuse/tokens | typescript, vitest | 5.6.3, 2.1.8 |
| @nexuse/domain | typescript, vitest | 5.6.3, 2.1.8 |
| @nexuse/validation | zod; @nexuse/domain | 3.23.8; workspace |
| @nexuse/catalog | @nexuse/domain, @nexuse/validation | workspace |
| @nexuse/web | next, react, react-dom | 15.1.3, 18.3.1, 18.3.1 |
|  | @types/react, @types/react-dom, @types/node | 18.3.12, 18.3.1, 20.17.10 |
| @nexuse/mobile | expo, expo-router | ~52.0.20, ~4.0.14 |
|  | react, react-native | 18.3.1, 0.76.5 |
|  | react-native-screens, safe-area-context | ~4.4.0, 4.12.0 |
|  | async-storage, netinfo | 1.23.1, 11.4.1 |
|  | expo-image-picker, expo-constants, expo-linking, expo-splash-screen, expo-status-bar | ~16.0.3, ~17.0.3, ~7.0.3, ~0.29.18, ~2.0.0 |
|  | @expo/vector-icons, @babel/core, @types/react | 14.0.4, ^7.25.2, 18.3.12 |

Risks: Expo SDK 52 is not current; run `npx expo install --fix`. Next 15.1.3 with React 18.3.1 is within its peer range but unusual (Next docs favour 19). `.npmrc` sets `node-linker=hoisted` (needed for Metro). Local sandbox ran TypeScript **7.0.2** and zod **3.25.76**, not the pinned versions.

## 3. Web app (`apps/web`) — 📝 written, not built
Implemented (code exists): layout with skip link, sticky header with category select + search, category nav strip, footer; home (hero, shop by category/budget/condition, "fresh listings"); `/search` (GET filter form, pagination); `/categories`; `/category/[slug]`; `/product/[id]`; `/wishlist` (device-local, localStorage via `useSyncExternalStore`); `/account` and `/account/sign-in` (honest "not available" pages); `/sell` (client form validated with `listingFormSchema`, photo type/size/magic-byte checks, **publish disabled**); `/safety`; loading/error/not-found; offline banner; light/dark tokens as CSS variables; security headers in `next.config.mjs`; original logo SVG.
Verified: 10 server-render smoke checks (cards, escaping, empty/unavailable/offline/skeleton states, filter form, header, account) passed using throwaway shims for `next/link` & `next/navigation`.
**Not verified:** `next build`, type-check (no `@types/react`/`next` offline), browser rendering, responsive layout, keyboard/screen-reader accessibility, image gallery, Lighthouse.
Missing/known problems: no community switcher or "Coming soon" community display yet; `FilterForm`/`Header` do not carry the `community` param; `SellForm` photo-URL cleanup effect captures an empty array (preview URLs leak until page unload); `apps/web/.gitignore` contains a stray `next-env.d.ts.bak` line; product images use plain `<img>` (no optimisation, remote domains unconfigured); no pagination on wishlist; no recently-viewed, seller profile, cart, or order pages; no analytics, no sitemap/robots, no i18n; lint is a placeholder `echo`.

## 4. Android app (`apps/mobile`) — 📝 written, never compiled or run
Code exists for: tabs (Home, Categories, Sell, Wishlist, Account), search (condition/sort chips), category and product screens, shared loading/empty/error/offline states (NetInfo), AsyncStorage wishlist, sell screen with `expo-image-picker` + shared validation (**publish disabled**), light/dark theming from shared tokens, generated icons/splash (not visually reviewed). `app.json`: package `com.nexusego.app` (**placeholder — must be decided before first Play build; immutable afterwards**), location/audio permissions blocked.
**Not verified:** install, Metro bundling of workspace TS packages, type-check, emulator/device run, accessibility, EAS build, signing, Play listing assets.
Known issues: `StatusBar style={dark ? 'light' : 'light'}` is redundant; search screen `router.setParams` behaviour untested; `useListings` re-fetch semantics untested; typed routes (`experiments.typedRoutes`) may flag `router.push('/categories')` strings until `.expo/types` is generated; no push notifications, deep links beyond scheme, image caching, or crash reporting.

## 5. Database and Supabase — 🟡 schema applies; security tests NOT passing
Files: `supabase/migrations/0001_core_schema.sql` (tables), `0002_security_rls.sql` (helpers, triggers, grants, RLS, `search_listings()`), `0003_storage.sql` (bucket + policies), `seed.sql` (generated from `@nexuse/catalog` by `scripts/generate-seed.ts`), `tests/` (local Supabase shim, RLS suite, `run.sh`).
Tables: communities, categories (2-level), user_roles, profiles (+ `public_profiles` view), listings, listing_images, listing_moderation_notes, wishlists, blocks, conversations, messages, reports, audit_logs. Designed (in SQL) but **unproven**: status-machine trigger, moderation-only approval, re-review on edit of live listing, minors need guardian verification to sell/chat, blocking, private messages (staff cannot read), column-level grants, audit triggers, image-count/path guard.
Executed on a scratch PostgreSQL 16 with a Supabase *emulation shim* (not real Supabase): shim + 3 migrations + seed applied cleanly, seed re-ran idempotently. **No real Supabase project exists or was ever connected.** `supabase/config.toml` does not exist (no Supabase CLI setup).
**RLS test result: 84 passed, 38 failed, 122 total — treat as FAILED/INVALID.** Diagnosis: the failures cascade from the test fixtures, not (as far as shown) from the policies — (a) the first listing/conversation inserts supply an explicit `id` column that the column-level `INSERT` grant intentionally excludes ("permission denied for table listings"), so later steps operate on rows that never existed; (b) several "must be denied" checks use `UPDATE`, which RLS turns into a silent 0-row update instead of an error, so the helper reports "unexpectedly succeeded". Until the suite is fixed to (i) not pass `id`, and (ii) assert rows-affected, nothing past profile tests is proven. One more thing to decide: whether clients may supply `id` (probably not). Also a wrongly-written test line (`DO` loop for images) was rewritten only in a scratch copy, not in the project.

## 6. Authentication and OTP — ⬜ not implemented
- No Supabase client code in either app. No sign-in, sign-up, session handling, profile creation flow, account recovery, or student-verification flow.
- UI pages state plainly that sign-in is not available; there is **no fake OTP and no placeholder auth** anywhere (checked by design review; `scripts/check-secrets.sh` ✅ finds no service-role references or JWT-like strings).
- Needed: Supabase phone auth + SMS provider (e.g. Twilio/MSG91 — DLT registration is required in India), CAPTCHA, rate limits, profile creation (DOB → `is_minor`), guardian-verification flow for under-18s (legal review under India's DPDP Act 2023), and optional privacy-preserving student verification. Phone verification must never be shown as proof of student status.

## 7. Multi-community architecture — 🟡 partly implemented, partly verified
Done and tested (24 catalog tests, ✅ under stand-in runner): `communities.ts` (Students `active`; Workers, Families, Professionals, Small businesses `coming_soon`), community-scoped categories (14 student categories + 4 exam subcategories; inactive communities expose **zero** categories), `SearchParams.community`, URL parsing ignores inactive communities, memory-repo scoping, generated DB seed.
In SQL (unproven, see §5): `community_id` on categories and listings; triggers reject listings in inactive communities and category/community mismatches; RLS hides listings/categories of non-active communities; admin-only community changes with audit log.
Missing: apps do not yet read communities/categories from the DB (static config only); no community switcher/landing pages, no "Coming soon" display in UI; no admin UI to activate/deactivate; community-aware analytics; per-community listing rules/moderation settings; `coming_soon` is used instead of `inactive` for the other four (they are functionally inactive, display-only).

## 8. Missing features (all)
Backend connection (Supabase client, real `ListingsRepository`), auth/OTP, profiles, create/edit/pause/remove listings, image upload to Storage, moderation queue, admin dashboard (users, listings, reports, categories, communities, audit logs, analytics), seller profiles & dashboard, messaging UI (schema only) & realtime, reporting/blocking UI, recently viewed, synced wishlist, cart/orders/transactions tables, commission collection (only a pure calculator exists), payment/shipping providers (interfaces only; `CHECKOUT_ENABLED=false`), guardian flow, student verification, notifications, search at scale (Postgres FTS function exists, unproven; no PIN/location radius), Edge Functions (none), lint config, component/E2E tests, CI that actually ran, privacy policy/terms pages, DPDP compliance checklist, `PROJECT_STATUS.md` / `CHANGELOG.md` / `NEXT_STEPS.md`, app store assets, Sentry/analytics, accessibility audit, Hindi/regional-language support.

## 9. Known bugs and incomplete code
1. **RLS test suite invalid** (§5) — highest priority.
2. `listings` `INSERT` grant omits `id`; if any client needs a client-generated id (offline drafts) the grant must change. Decide deliberately.
3. `prohibited.ts` phone regex flags any 10-digit number starting 6–9, even inside longer numbers (ISBNs); advisory only.
4. Web `SellForm` object-URL cleanup bug; web `.gitignore` stray line; mobile redundant StatusBar expression.
5. Condition value renamed `used` → `acceptable` in code in Batch 3; any earlier saved data or tests assuming `used` are obsolete (no stored data exists).
6. `FilterForm`/header omit `community` param (works only because Students is the default).
7. Wishlist stores IDs only; with no backend it cannot show item details.
8. `listing_images_guard` and `listings_guard` treat `auth.uid() IS NULL` as "trusted" — correct for service role/migrations, but anything that reaches the DB without a user JWT (e.g. a misconfigured function) bypasses these checks. Review when Edge Functions are added.
9. Seed `ON CONFLICT` deliberately does not overwrite community `status`; admin changes survive re-seeding (intended).
10. `@nexuse/catalog` `FEATURES` flags are compile-time constants; no runtime flag source yet.

## 10. Build, test, type-check status
| Check | Status | Detail |
|---|---|---|
| `pnpm install` | ❌ NOT EXECUTED | no network; no lockfile; CI will fail until `pnpm-lock.yaml` is committed (workflow `generate-lockfile` provided) |
| Unit tests (tokens 7, domain 16, validation 20, catalog 24 = 67) | 🟡 67/67 passed | run with Node+tsx against a **self-written stand-in for vitest**, not vitest 2.1.8; re-run `pnpm test` |
| Type-check, 4 packages | 🟡 clean | TypeScript 7.0.2 (not the pinned 5.6.3); validation test file shows implicit-any errors only under the loose stand-in typings |
| Type-check `apps/web`, `apps/mobile` | ❌ NOT EXECUTABLE here | missing `@types/react`, `next`, `expo` |
| Web smoke render | 🟡 10/10 | partial, shimmed |
| `next build`, `expo` bundle/build, Android emulator | ❌ NOT EXECUTED | |
| Lint | ⬜ | placeholder `echo` scripts |
| Component / E2E tests | ⬜ | none written |
| Migrations apply | 🟡 | scratch Postgres 16 + Supabase shim; not real Supabase CLI |
| RLS / auth / authorization tests | ❌ FAILED/INVALID | 84 pass, 38 fail (fixture defects; see §5) |
| Seed up to date | ✅ | `scripts/generate-seed.ts --check` |
| Secrets scan | ✅ | `scripts/check-secrets.sh` exit 0 |

## 11. Security and database risks
- **No security guarantee can be claimed yet:** RLS tests don't pass; Supabase behaviours (JWT claim handling, column-grant interplay with PostgREST, storage policies) were only emulated.
- Privacy: DOB is stored for age gating — minimal-data and consent/retention needed for DPDP; minors' data and guardian consent need legal review before launch.
- Public storage bucket: anyone with a URL can read photos, including those of unapproved/removed listings; consider signed URLs or moderation-gated paths.
- Photo content: MIME/size are enforced; magic-byte check exists only client-side (web). Server-side image validation, EXIF stripping (location!), and malware/NSFW scanning are not implemented.
- `public_profiles` view runs with owner rights (intentional) — expose only the listed columns; re-check on every change.
- Moderator cannot read messages (privacy) — but then abuse reports about chats need a controlled, audited evidence-access path (not built).
- No rate limiting on message/report/listing creation; no abuse/fraud heuristics beyond a regex hint.
- Admin role assignment is service-role only (no UI) — safe but operationally manual; no MFA requirement for admins defined.
- Client wishlist/localStorage is unencrypted device storage (non-sensitive IDs only).
- Dependencies unaudited; versions unverified; no `pnpm audit`, no Dependabot.
- Payment/commission: nothing collects money; commission logic is a calculator only. Any future payment feature needs provider contracts, KYC/payouts, GST/TDS review.
- Legal: marketplace intermediary obligations (IT Rules), prohibited-items policy, grievance officer, terms/privacy pages — none drafted.

## 12. Exact next steps (in order)
1. On a machine with network: `corepack enable && pnpm install`, commit `pnpm-lock.yaml`. Run `pnpm test`, `pnpm typecheck`; fix whatever real vitest/TS 5.6/Next/Expo type packages report. Run `npx expo install --fix` in `apps/mobile`.
2. `pnpm --filter @nexuse/web build` and `npx expo start --android`; fix build errors; manually test every route/screen at 360/768/1280 px with a screen reader.
3. **Fix `supabase/tests/rls_tests.sql`:** drop explicit `id` columns from inserts (or capture generated ids via `RETURNING`), and make every "denied UPDATE/DELETE" check assert zero rows affected. Re-run `supabase/tests/run.sh` (as the `postgres` OS user) until 100% pass; then re-run against a real project with `supabase start` (CLI) and `supabase db reset`.
4. Add `supabase/config.toml`; create a Supabase project; set env vars (§ `.env.example`); configure phone auth + SMS provider (DLT in India) + CAPTCHA.
5. Implement Supabase-backed `ListingsRepository` (anon key + RLS only) for web and mobile; use `search_listings()`; map category slug → id; read communities/categories from DB; flip `FEATURES.browseListings` only after an end-to-end test.
6. Auth + profile creation (DOB → `is_minor`), guardian-verification design (legal), session handling, account screens.
7. Seller flows: create/edit/pause listing, image upload to Storage with path convention, submit for review; moderation queue.
8. Admin app/area (server-side authorised): moderation, reports, categories, communities toggle, audit-log viewer, basic analytics. Add admin permission tests.
9. Messaging UI with Realtime, block/report UI, reporter-evidence path for chat reports.
10. Community UX: switcher, "Coming soon" display for inactive communities, per-community landing pages; test activation/deactivation end to end.
11. Quality: ESLint config, component tests, Playwright E2E, accessibility audit, CI actually green, `PROJECT_STATUS.md`/`CHANGELOG.md`/`NEXT_STEPS.md`, privacy policy/terms, DPDP checklist.
12. Decide Android package id; EAS build, signing, Play Console assets; staged rollout.
