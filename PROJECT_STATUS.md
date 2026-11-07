# PROJECT STATUS — NEXUSE GO

## 2026-11-07 (stabilization pass) — READ FIRST
This pass inspected the ZIP (commit 8908e95) and made Android/lint **configuration** changes **without network access**. Therefore:

| Check | Result in this pass |
|---|---|
| `pnpm install`, real Vitest 67/67, `pnpm typecheck` 6/6, Next.js build (12 routes), Expo Doctor 18/18 | **Not re-run here.** Taken from the developer's own Windows report; not independently verified by me. |
| `scripts/check-secrets.sh` | **Run, passed** (exit 0). |
| `scripts/android-preflight.mjs` | **Run in sandbox**: correctly reports missing ANDROID_HOME / node_modules (expected here). Node + JDK 21 detected. |
| JSON validity of edited `app.json` / `package.json` files | **Checked**, valid. |
| ESLint | **Config written, NOT executed.** Dependencies not installed, lockfile not updated. May need rule tuning on first run. |
| `expo-system-ui` | **Added to `apps/mobile/package.json` (~4.0.6), NOT installed**; lockfile not updated. Confirm with `npx expo install expo-system-ui` (it will pick the exact SDK 52 version). |
| Android Gradle build / APK | **NOT built. No APK exists.** Gradle, Android SDK and Windows were unavailable. |
| Supabase RLS suite (116/116) | Previously reported by an earlier session on an emulated Postgres; **not re-run** (no PostgreSQL here). |
| Web/mobile-specific tests | Still placeholders (`echo`). Only shared packages have real tests. |

Android native project (inspected, preserved, not regenerated): Gradle 8.10.2, compileSdk 35, targetSdk 34, minSdk 24, NDK 26.1.10909125, `com.nexusego.app`, New Architecture + Hermes. Changes: `allowBackup` false, `WRITE_EXTERNAL_STORAGE` removed, `colorPrimary` set to brand green. Debug builds do not embed JS (need Metro). Release is signed with the public debug keystore: local testing only.

Unchanged and still true: Students-only community, 2% commission logic untouched, no auth/OTP/payments/backend, bucket `listing-images` still public in migration 0003 (to become private in a later migration), DOB logic still in schema. Batch 4 not started.

Build instructions: `WINDOWS_ANDROID_BUILD.md`.

Updated: 2026-11-07 · Milestone: **Batch 3 complete as far as verifiable offline; build verification pending on a networked machine; Batch 4 architecture documented, not started** · Tagline: Buy. Sell. Reuse. · India · INR

## Owner decisions (provisional, 2026-11-07)
See `docs/DECISIONS.md`: providers unselected & modular; **no DOB**; guardian consent design-only; admin MFA mandatory; Mumbai preferred; `com.nexusego.app` provisional; private photos + signed URLs. **Known conflict:** the current schema/code still contains DOB logic (to be removed in Batch 4; impact list in DECISIONS.md) and bucket `listing-images` is still public in migration 0003 (to be made private in migration 0006). Nothing deployed; no data exists.

## Build verification status (important)
Verification script now classifies results honestly (PASSED / FAILED = project defect / NOT EXECUTABLE = environment / BLOCKED) — self-test passed; latest offline run: **INCOMPLETE — 3 passed, 0 failed, 7 not executable, 3 blocked** (`docs/BUILD-VERIFICATION.sandbox-run.md`). Which checks need network/GitHub: `docs/BUILD-VERIFICATION.md` §4.

The requested networked verification (lockfile, install, real vitest, TS 5.6, Next build, Expo, Android) **could not be executed** in the authoring environment (no registry access). Procedure and honest offline record: `docs/BUILD-VERIFICATION.md`, `scripts/verify-build.sh`, workflow `verify-build`. Batch 4 is **designed only** (`docs/BATCH-4-ARCHITECTURE.md`) and is gated on that verification.

## What this is today
A monorepo with a **front-end preview** (web + Android) and a **database design that passes its local security tests**. There is **no live backend, no auth, no real listings**. Full detail: `docs/HANDOVER-REPORT.md`.

## Architecture
- `apps/web` Next.js 15 (React 18.3) · `apps/mobile` Expo SDK 52 Android · `packages/{tokens,domain,validation,catalog}` shared TS · `supabase/` migrations, generated seed, tests.
- One marketplace, community-scoped (`community_id`). Students ACTIVE; Workers, Families, Professionals, Small businesses = `coming_soon` (not functional: no categories/listings/search).
- Apps talk to data only through `ListingsRepository` (currently `unconfiguredRepository` → honest "not connected" states). `FEATURES` flags are all `false`.

## Completed AND verified (what "verified" means is stated)
| Item | Verification |
|---|---|
| Shared package unit tests: tokens 7, domain 16, validation 20, catalog 24 | executed — 67/67 pass **under a self-written vitest stand-in**, not real vitest |
| Package type-check (4 packages) | executed with TypeScript 7.0.2 (pinned is 5.6.3) — clean |
| Database migrations 0001–0003 + seed (twice) | executed on PostgreSQL 16 **with a local Supabase emulation shim** — apply cleanly |
| RLS / authorization / workflow / messaging-privacy / community activation / audit-log tests | executed — **116/116 pass** on that setup. Mutation check: deliberately weakening 3 rules made 9 tests fail |
| Seed generated from catalog is current | executed (`pnpm check:seed`) |
| Secrets scan | executed — clean |
| Web component smoke render (10 checks + footer) | executed with shimmed `next/link` |

## Written but NOT verified
Web app build/type-check/browser behaviour · Android app compile/run · accessibility · responsive layout · CI workflows · dependency versions · `pnpm install` · real vitest · anything on real Supabase.

## Not started
Authentication/OTP (none, and no fake), profiles flow, guardian verification, Supabase client + real repository, listing create/edit/images upload, moderation UI, admin dashboard, messaging UI/Realtime, report/block UI, recently viewed, seller profiles, cart/orders, payments, shipping, Edge Functions, lint, component & E2E tests, legal pages.

## Known bugs / limitations
See HANDOVER-REPORT §9. Updated since: RLS suite fixed (was invalid); `SellForm` URL leak fixed; StatusBar and `.gitignore` nits fixed. Still open: phone regex false positives in `prohibited.ts`; apps ignore the `community` URL param (default is Students); `listings` INSERT grant excludes `id` by design; `auth.uid() IS NULL` is treated as trusted by triggers (service role / migrations) — review before adding Edge Functions.

## Required external services (none configured)
Supabase project (DB, Auth phone, Storage, Realtime, Edge Functions) · SMS provider with TRAI DLT registration · CAPTCHA (hCaptcha/Turnstile) · Sentry (optional) · GitHub Actions · Expo EAS + Google Play Console · (future) payment aggregator, shipping provider.

## Environment variables (see `.env.example`; placeholders only)
Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CAPTCHA_SITE_KEY`, `NEXT_PUBLIC_SENTRY_DSN`. Server-only (Supabase secrets/CI, never in client code): `SUPABASE_SERVICE_ROLE_KEY`, `CAPTCHA_SECRET_KEY`, `SMS_PROVIDER_ACCOUNT_SID`, `SMS_PROVIDER_AUTH_TOKEN`. Flag: `CHECKOUT_ENABLED=false`.

## Database migration instructions
Local emulated check: `su postgres -c "bash supabase/tests/run.sh"` (needs Postgres 14+ binaries, non-root). Real project: `supabase init && supabase start && supabase db reset` (applies `migrations/` then `seed.sql`); on a hosted project use `supabase db push`. Regenerate seed after catalog changes: `pnpm gen:seed`. Grant staff roles only with the service role: `insert into user_roles(user_id, role) values (…,'admin')`.

## Test commands
`pnpm install` → `pnpm test` → `pnpm typecheck` → `pnpm check-secrets` → `pnpm check:seed` → DB suite above. (Only the DB suite, secrets scan and seed check were actually executed in the authoring sandbox.)

## Current milestone & exact stopping point
Batch 3 done: community config, community-scoped categories, commission/roles logic, schema + RLS + storage migrations, tests, docs, coming-soon display. **Batch 3 NOT done:** apps reading communities/categories from the DB, community switcher/landing pages, admin dashboard, real-Supabase test run. Next tasks: `NEXT_STEPS.md`.
