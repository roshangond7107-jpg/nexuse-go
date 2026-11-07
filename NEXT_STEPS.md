# NEXT STEPS (dependency-ordered)

## Immediate (stabilization follow-up), in order
1. `pnpm install`; commit the updated `pnpm-lock.yaml`. In `apps/mobile` run `npx expo install expo-system-ui` and `npx expo install --check`.
2. `pnpm lint`. Expect some findings; fix real ones, tune rules only with justification. Then `pnpm typecheck`, `pnpm test`, `pnpm build` to confirm nothing regressed.
3. `pnpm android:doctor`, then follow `WINDOWS_ANDROID_BUILD.md`. Send the full Gradle output if it fails; fix only reproducible errors. Do not call Android "verified" until an APK exists and `aapt2 dump badging` shows `com.nexusego.app`.
4. Confirm `expo-system-ui` warning is gone with `npx expo-doctor` and by running `expo prebuild` into a scratch copy (do not overwrite `apps/mobile/android` blindly; diff first).
5. Re-run the DB/RLS suite on a networked machine; later against real Supabase.
Risks: lockfile out of sync until step 1; ESLint rules untested; first Gradle build may hit Windows path-length, NDK/CMake or JDK issues; release APK is debug-signed.
Then continue with the existing list below (Batch 4 only after steps 1-4 pass).


Each step lists what it needs. "Unblocks" = what cannot start before it.

0a. **Owner/legal inputs** (none block step 0): choose SMS provider & CAPTCHA via `docs/PROVIDER-EVALUATION.md`; counsel review of `docs/AGE-VERIFICATION-REQUIREMENTS.md` and `docs/GUARDIAN-CONSENT-WORKFLOW.md`; start TRAI DLT registration; verify `com.nexusego.app` availability.
0. **Run `verify-build`** (GitHub Actions workflow or `bash scripts/verify-build.sh`) — produces the real lockfile and `docs/BUILD-VERIFICATION.generated.md`. Commit both, send me the failures. Details: `docs/BUILD-VERIFICATION.md`. Batch 4 plan: `docs/BATCH-4-ARCHITECTURE.md` (needs owner decisions D1–D8).
1. **Install & lockfile** — needs a machine with network. `corepack enable && pnpm install`, commit `pnpm-lock.yaml`; `npx expo install --fix` in `apps/mobile`. Unblocks: every real test/build.
2. **Run what was never run** — `pnpm test` (real vitest), `pnpm typecheck` (incl. both apps), `pnpm --filter @nexuse/web build`, `npx expo start --android`. Fix errors. Replace the "unexecuted" rows in `docs/completion-checklist.md` with real results.
3. **Real Supabase** — `supabase init` (adds `config.toml`), `supabase start`, `supabase db reset` (runs migrations + `seed.sql`), re-run the RLS suite against it by porting `supabase/tests/rls_tests.sql` to pgTAP/`supabase test db`. The emulation shim does not prove real JWT-claim behaviour, PostgREST column-grant behaviour, or Storage policy behaviour.
4. **Auth** — needs: Supabase project, SMS provider with DLT registration, CAPTCHA keys. Build phone-OTP sign-in, profile creation (DOB → `is_minor` is computed by a DB trigger), sessions. Never accept a client-claimed "verified".
5. **Supabase-backed `ListingsRepository`** (web + mobile; anon key + RLS only) using `search_listings()`. Read communities/categories from DB. Flip `FEATURES.browseListings` only after an end-to-end test.
6. **Seller flows** — create/edit/pause/remove listing, upload to bucket `listing-images` at `<seller>/<listing>/<file>`, submit for review. Add server-side image validation + EXIF stripping (Edge Function).
7. **Moderation + admin** — server-side authorised admin area: listing queue, reports, categories, community activation, users, audit-log viewer, basic analytics. Add admin permission tests. Decide an audited evidence path for reported chats (moderators cannot read messages today).
8. **Messaging UI** (Realtime), block/report UI, rate limits.
9. **Community UX** — switcher + landing pages driven by DB; test activation/deactivation end to end in the apps.
10. **Guardian flow for under-18s** — needs legal sign-off on the verification method.
11. **Quality** — ESLint, component tests, Playwright E2E, accessibility audit, green CI.
12. **Legal** — work through `docs/compliance-checklist.md` with counsel; publish Terms/Privacy/grievance officer.
13. **Release** — decide Android package id; EAS builds, signing, Play Console assets.
