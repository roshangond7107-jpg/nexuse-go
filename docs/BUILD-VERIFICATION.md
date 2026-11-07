# Build verification — results, gaps and unresolved risks
> **Updated 2026-11-07 (later):** the verification script was rewritten to separate environment problems from project problems (see §5). The first offline record (`BUILD-VERIFICATION.sandbox-run-v1-superseded.md`) mislabelled network failures as FAILED; the corrected record is `BUILD-VERIFICATION.sandbox-run.md` (verdict INCOMPLETE: 3 passed, 0 failed, 7 not executable, 3 blocked). Tables in §1 below remain accurate in substance.
Written 2026-11-07, **before** any Batch 4 work, as required.

## 1. Result: the networked verification could NOT be executed in the authoring environment
The environment available to me has no route to the npm registry (`getaddrinfo ENOTFOUND registry.npmjs.org`; `corepack` cannot even download pnpm 9.15.0) and package installs are disabled. I therefore **cannot** generate a genuine `pnpm-lock.yaml`, run real vitest, run Next/Expo, or build an APK. I will not fabricate them. Instead I prepared the exact procedure and ran it here to record what actually happens offline.

| Requested step | Status | Evidence |
|---|---|---|
| Genuine `pnpm-lock.yaml` | **NOT EXECUTABLE here** | corepack/pnpm download fails (record: `docs/BUILD-VERIFICATION.sandbox-run.md`). No lockfile exists in the ZIP. |
| `pnpm install` (incl. `--frozen-lockfile` reproducibility) | **NOT EXECUTABLE here** | same |
| Real vitest tests | **NOT EXECUTABLE here** | needs install. (67 tests passed earlier under a stand-in runner — *not* a substitute.) |
| TypeScript checks with pinned TS 5.6.3 | **NOT EXECUTABLE here** | earlier 4-package check used TS 7.0.2 |
| Next.js production build | **NOT EXECUTABLE here** | |
| Expo dependency validation / doctor | **NOT EXECUTABLE here** | |
| Android application (JS bundle / APK) | **NOT EXECUTABLE here** | also needs JDK 17 + Android SDK |
| Database migrations + RLS suite | **PASSED** | re-run from `scripts/verify-build.sh`: 116/116 on Postgres 16 + Supabase emulation shim |
| Secrets scan; seed-current check | **PASSED when invoked directly** | `bash scripts/check-secrets.sh` exit 0; `tsx scripts/generate-seed.ts --check` up to date. (In the first script version these showed FAILED only because they were invoked through pnpm; the secrets scan now runs directly, the seed check is correctly BLOCKED until install succeeds.) |

### How to execute the real verification (one command)
- **Easiest:** push the repo to GitHub and run the **`verify-build`** workflow (Actions → Run workflow). It installs pnpm, generates `pnpm-lock.yaml`, re-installs with `--frozen-lockfile`, runs secrets/seed/vitest/typecheck/Next build, `expo install --check`, `expo-doctor`, `expo export --platform android` (Metro bundle), Gradle `assembleDebug`, and the DB suite; it uploads `pnpm-lock.yaml` and `docs/BUILD-VERIFICATION.generated.md` (raw exit codes + output tails). Commit both.
- **Locally:** `bash scripts/verify-build.sh` on a machine with Node ≥ 20.11 (optionally JDK 17 + Android SDK + Postgres).
- Send me the generated report (or paste failures) and I will fix them and record the results in this file.

## 2. Unresolved risks (predictions, NOT results — each is unconfirmed until the step above runs)
1. **Pinned versions are from memory**; any might not exist/resolve. Expo SDK 52 is not current; `expo install --check` will likely list mismatches (fix with `npx expo install --fix`).
2. **Next 15.1.3 + React 18.3.1**: within peer range but atypical; `@types/react` 18 vs Next's bundled types may produce type errors.
3. **Web/mobile TSX never type-checked.** Likeliest errors: `exactOptionalPropertyTypes`-adjacent/`noUncheckedIndexedAccess` strictness in components; `React.ChangeEvent` generics; Expo Router typed routes (`experiments.typedRoutes`) rejecting string `router.push('/categories')` and `{ pathname: '/product/[id]' }` until `.expo/types` exists; `Ionicons` name typing; `replaceAll` needs lib ES2021 (set to ES2022 — fine).
4. **Real vitest typings**: `it.each` tuple typing in `validation.test.ts` should be fine; unverified.
5. **TypeScript 5.6 vs 7.0.2**: code type-checked only under 7.0.2.
6. **Metro + workspace TS sources** via `node-linker=hoisted`: resolution of `@nexuse/*` (TS in `src/`, `main: src/index.ts`) is unproven; may need `watchFolders`/`nodeModulesPaths` in `metro.config.js`.
7. **Next `transpilePackages`** for `@nexuse/*` and extensionless TS imports: unproven.
8. **React 18 + `useSyncExternalStore`** server snapshot in `wishlist-store.ts`: expected fine; hydration behaviour unverified.
9. **Server components calling an async function component (`Results`)** is standard in Next 15; only unit-smoke-tested via direct invocation.
10. **Real Supabase vs emulation**: the 116 RLS tests prove logic on a shim. Not yet proven on real Supabase: PostgREST handling of column-level grants, `auth.uid()` from real JWT claims, Storage RLS (`storage.objects`) behaviour, the `public_profiles` view ownership/privileges, and Supabase's default privileges for new tables (our migration revokes then grants explicitly, which should hold).
11. **CI workflows have never run** on GitHub (`ci.yml`, `generate-lockfile.yml`, `verify-build.yml`).
12. **No ESLint**; lint scripts are placeholders.
13. **Android package id** `com.nexusego.app` is a placeholder (immutable after first Play upload).
14. **Accessibility/responsiveness** never checked in a browser/device.

## 3. Verified inventory of the Batch 3 ZIP (step "First")
Unzipped `nexuse-go-batch3.zip` into a clean directory and diffed against the working tree: **identical**; no `node_modules`, no `.env`. Present: PROJECT_STATUS.md, CHANGELOG.md, NEXT_STEPS.md, docs/{HANDOVER-REPORT,compliance-checklist,completion-checklist}.md, migrations 0001–0003, seed.sql (current), tests (shim, 116-check suite, run.sh), communities.ts (Students `active`; 4 others `coming_soon`), commission.ts, roles.ts, generate-seed.ts, 32 RLS policies in 0002. DB suite re-executed from this tree: 116/116.

## 4. Which checks need network / GitHub / extra tools
"GitHub" means the `verify-build` workflow (or any networked CI). Nothing here needs GitHub *itself* except the convenience of a ready networked runner with JDK/Android SDK/Postgres; any machine with the same capabilities works.

| Check | Network (npm registry) | GitHub runner needed? | Other prerequisites | Runs offline here? |
|---|---|---|---|---|
| Tool versions, secrets scan (`check-secrets.sh`) | no | no | bash, grep | **yes** — PASSED |
| Database migrations + 116 RLS tests | no | no | PostgreSQL 14+ server binaries; non-root (script uses `su postgres` if root) | **yes** — PASSED |
| Classifier self-test (`--self-test`) | no | no | bash, curl | **yes** — PASSED |
| pnpm install / lockfile generation | **yes** (also to download pnpm itself via corepack) | no (any networked machine) | Node ≥ 20.11 | no — NOT EXECUTABLE |
| `--frozen-lockfile` reproducibility | yes | no | the generated lockfile | no |
| Seed-current check, real vitest, TypeScript 5.6.3 checks | needs the install first (so transitively yes) | no | install done | no — BLOCKED |
| Next.js production build | yes (install; Next may also fetch SWC binaries/fonts) | no | install done | no |
| Expo dependency validation / doctor | yes (queries Expo's version API) | no | install done | no |
| Android JS bundle (`expo export`) | yes | no | install done | no |
| Android debug APK (Gradle) | yes (Gradle/Maven dependencies) | no | JDK 17, Android SDK (`ANDROID_HOME`), ~10 GB disk | no |
| `generate-lockfile` / `verify-build` workflows | yes | **yes** — they are GitHub Actions workflows; they have never run | repository on GitHub | n/a |
| `ci.yml` (push/PR) | yes | **yes** | committed `pnpm-lock.yaml` | n/a |
| Real Supabase tests (planned) | yes | no | Docker + Supabase CLI, or a Supabase project | no |
| SMS/OTP, CAPTCHA, Mumbai-region project (planned) | yes | no | provider accounts, DLT registration | no |

## 5. Result classes, exit codes and how misclassification is avoided
| Result | Meaning | Counts as a project defect? |
|---|---|---|
| PASSED | exit 0 | no |
| FAILED | ran, exit ≠ 0 (or timed out), output has no environment signature | **yes** |
| NOT EXECUTABLE | a required capability is missing (`net`, `pnpm`, `android`, `postgres`, Node ≥ 20.11) **or** the command ran and its output matched a network-error signature (ENOTFOUND, EAI_AGAIN, ECONNREFUSED, ETIMEDOUT, getaddrinfo, "fetch failed", ERR_PNPM_META_FETCH_FAIL, TLS/certificate, …) | no — re-run where it can execute |
| BLOCKED | a prerequisite step is not PASSED (e.g. tests need install) | no |
| SKIPPED | operator set `SKIP=<ids>` | no |
Exit code: `0` everything required PASSED (verdict VERIFIED) · `1` at least one FAILED · `2` nothing failed but verification is INCOMPLETE. The report (`docs/BUILD-VERIFICATION.generated.md` + `.json`) opens with the verdict and an environment-capability table.
Known limits of the heuristic: a project test whose output happens to contain a network-error phrase would be shown as NOT EXECUTABLE — the matched line is printed in the "Why" column so a human can judge; and a real failure can hide behind an earlier network failure only in BLOCKED steps, which is why the verdict is INCOMPLETE rather than VERIFIED. `bash scripts/verify-build.sh --self-test` proves the classifier on synthetic commands (pass, genuine failure, network error, missing capability, blocked dependent, timeout, skip) — executed: PASSED.
