# CHANGELOG

## Stabilization pass (2026-11-07) — unreleased, changes unverified except where noted
Added
- `WINDOWS_ANDROID_BUILD.md`; `scripts/android-preflight.mjs` (read-only env check; ran in sandbox); `scripts/build-android-apk.mjs` (wraps Gradle, only reports an APK if the file exists; NOT run end-to-end); `.gitattributes` (LF for `gradlew`/`*.sh`, CRLF for `*.bat`); `eslint.config.mjs` (flat config, NOT run).
- Dependencies (declared, NOT installed, lockfile NOT regenerated): root devDependencies `eslint 9.17.0`, `@eslint/js 9.17.0`, `typescript-eslint 8.18.2`, `eslint-plugin-react-hooks 5.1.0`, `@next/eslint-plugin-next 15.1.3`; mobile `expo-system-ui ~4.0.6`.
Changed
- `apps/mobile/app.json`: `android.allowBackup=false`; blocked `WRITE_EXTERNAL_STORAGE`.
- `apps/mobile/android/app/src/main/AndroidManifest.xml`: `allowBackup="false"`; `WRITE_EXTERNAL_STORAGE` removed via `tools:node="remove"` (mirrors app.json; hand-edited, not regenerated with prebuild).
- `apps/mobile/android/app/src/main/res/values/colors.xml`: `colorPrimary` #023c69 -> #164B31.
- All `lint` scripts (web, mobile, 4 packages) changed from `echo` placeholders to `eslint .`; mobile gained `android:doctor`, `android:apk:debug`, `android:apk:release-local`; root gained `android:doctor`.
Removed: nothing. Not touched: web app, shared packages, migrations, seed, tests, pnpm version.
Required follow-up: run `pnpm install` (not frozen) and commit the updated `pnpm-lock.yaml`; until then `pnpm install --frozen-lockfile` (CI) will fail.

Only what actually happened. No invented history.

## Batch 3.6 — verification workflow hardening & decision records (docs/scripts only; no source, migration or test changed)
**Modified**: `scripts/verify-build.sh` (rewritten: capability preflight, result classes PASSED/FAILED/NOT EXECUTABLE/BLOCKED/SKIPPED, dependency tracking, verdict + exit codes 0/1/2, JSON output, `--self-test`), `.github/workflows/verify-build.yml` and `ci.yml` (self-test step, JSON artifact), `docs/BUILD-VERIFICATION.md` (§4 network/GitHub matrix, §5 classes), `docs/BATCH-4-ARCHITECTURE.md` (amendment notes for D3/D4/D5/D8, original text kept), `docs/compliance-checklist.md`, PROJECT_STATUS.md, NEXT_STEPS.md. **Added**: `docs/DECISIONS.md`, `docs/AGE-VERIFICATION-REQUIREMENTS.md`, `docs/GUARDIAN-CONSENT-WORKFLOW.md`, `docs/PROVIDER-EVALUATION.md`, `docs/BUILD-VERIFICATION.sandbox-run.md` (corrected offline record). **Renamed**: first offline record → `docs/BUILD-VERIFICATION.sandbox-run-v1-superseded.md` (kept, marked superseded: it mislabelled network failures as FAILED). **Executed**: classifier self-test PASSED; offline run verdict INCOMPLETE (3 passed / 0 failed / 7 not executable / 3 blocked). **Not executed**: everything needing the npm registry.

## Batch 3.5 — verification prep & Batch 4 design (docs/scripts only; no app or DB logic changed)
**Added**: `scripts/verify-build.sh`, workflow `verify-build.yml`, `docs/BUILD-VERIFICATION.md`, `docs/BUILD-VERIFICATION.sandbox-run.md` (raw offline run record), `docs/BATCH-4-ARCHITECTURE.md`. **Modified**: PROJECT_STATUS.md, NEXT_STEPS.md. **Verified**: ZIP contents identical to working tree; DB suite 116/116 re-run. **Not executed**: install/lockfile/vitest/typecheck/Next/Expo/Android (no network).

## Batch 3 (see PROJECT_STATUS.md)
**Added**
- `@nexuse/catalog`: `communities.ts` (Students active; Workers/Families/Professionals/Small businesses `coming_soon`), community-scoped two-level categories (14 student categories + 4 exam subcategories), `SearchParams.community`.
- `@nexuse/domain`: `commission.ts` (proposed 2% commission, eligible only for completed + both-party-confirmed sales; provider fees/tax kept separate), `roles.ts` (UI-only permission mirror).
- `supabase/`: migrations 0001 (schema), 0002 (helpers, triggers, grants, RLS, `search_listings()`), 0003 (storage bucket + policies); generated `seed.sql`; `tests/` (Supabase emulation shim, 116-check RLS suite, `run.sh`).
- `scripts/generate-seed.ts` (+ `pnpm gen:seed`, `pnpm check:seed`).
- CI job `database` (applies migrations, runs RLS suite on throwaway Postgres) and seed check. Never run on GitHub.
- Web footer + mobile categories screen list communities coming later (display only).
- Docs: HANDOVER-REPORT, PROJECT_STATUS, NEXT_STEPS, CHANGELOG, compliance-checklist.
**Changed**
- Listing condition `used` → `acceptable` (validation, catalog, web home) to match the product spec.
- `CATEGORIES` now = top-level categories of the default active community; old slugs (`textbooks`, `exam-prep`, `calculators`, `notes`, …) were replaced by the new student category slugs. **Breaking** for any stored slug/URL (none existed in production).
- `SellForm` object-URL cleanup bug fixed; mobile redundant StatusBar expression removed; web `.gitignore` cleaned.
**Database changes**: all new (see migrations). No existing database existed.
**Removed**: nothing.

## Batch 2
Added `@nexuse/catalog`, `apps/web` (Next.js storefront), `apps/mobile` (Expo Android), CI lockfile guard + `generate-lockfile` workflow, `.npmrc`, `listingFormSchema`, `themeToCssVars`. Fixed catalog tsconfig (DOM lib).

## Batch 1
Monorepo config, `@nexuse/tokens`, `@nexuse/domain`, `@nexuse/validation`, check-secrets script, CI.
