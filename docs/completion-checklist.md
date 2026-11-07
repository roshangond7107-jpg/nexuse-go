# Completion Checklist
Legend: ✅ executed & passed · 🟡 executed only in a limited/substitute way (see notes) · 📝 written, NOT executed · ⬜ not started · ⚠️ incomplete / blocked

## How verification was done (read this first)
The authoring sandbox had **no network access**: `pnpm install`, real `vitest`, Next.js, Expo and React type packages could not be installed.
- Unit tests were run with Node + `tsx` against a **local stand-in for the `vitest` API** (describe/it/it.each/expect subset) with the real `zod` 3.25.x available locally. This proves test logic passes, **not** that real vitest 2.1.8 passes. Re-run `pnpm install && pnpm test` to confirm.
- Type checking used TypeScript **7.0.2** (what the sandbox had), not the pinned 5.6.3. Only the four packages were type-checked. `apps/web` and `apps/mobile` were **not** type-checked (no `@types/react`, `next`, `expo` available).
- `apps/web` components were smoke-rendered with `react-dom/server` using throwaway shims for `next/link` and `next/navigation`. `next build` and `expo` were **never run**.

## Batch 1
| Item | Status | Evidence / Notes |
|---|---|---|
| Monorepo config (pnpm, turbo, tsconfig) | 🟡 | Reviewed by reading; workspace refs consistent. Not installed. Added `.npmrc` (`node-linker=hoisted`, required for Expo/Metro). |
| `pnpm-lock.yaml` | ⚠️ **BLOCKED** | Cannot be generated offline, and a hand-written lockfile would be invalid. Run the new `generate-lockfile` GitHub workflow (or `pnpm install` locally) and commit the result. |
| CI reproducible install | 🟡 | `ci.yml` uses `pnpm install --frozen-lockfile` and now fails fast with a clear message if the lockfile is missing. CI will fail until the lockfile is committed. Never run on GitHub. |
| Dependency versions | ⚠️ | Pinned from memory, **not verified against the registry**. Expo SDK 52 set (expo ~52.0.20, RN 0.76.5, expo-router ~4.0.14) chosen as a known-consistent set; run `npx expo install --fix` in `apps/mobile` to align to the SDK. Next 15.1.3 with React 18.3.1 (peer range allows it; both apps share one React). |
| `.env.example` | 📝 | Placeholders only; no secrets. |
| `scripts/check-secrets.sh` | ✅ | Run: exit 0 (no SERVICE_ROLE refs or JWT-like strings in apps/packages). |
| `@nexuse/tokens` tests | 🟡 | 7/7 passed (stand-in runner). Added `themeToCssVars` + test. |
| `@nexuse/domain` tests | 🟡 | 11/11 passed (stand-in runner). No code changes. |
| `@nexuse/validation` tests | 🟡 | 20/20 passed (stand-in runner). Added `listingFormSchema` + test; `listingSchema` behaviour unchanged. |
| Package typecheck (tokens, domain, validation) | 🟡 | Clean under TS 7.0.2. (Validation test file showed implicit-any errors only because the stand-in typings are loose; real vitest types `it.each`.) |
| Bug found & fixed | ✅ | `@nexuse/catalog` failed typecheck (`URLSearchParams`/`AbortSignal` unknown): its `tsconfig` now includes `DOM` lib. Re-checked clean. |
| Known weakness (not changed) | ⚠️ | `prohibited.ts` flags any 10-digit number starting 6–9 as "off-platform contact" (also matches inside longer digit strings; will false-positive on ISBN/phone-like numbers). Advisory only. |

## Batch 2
| Item | Status | Evidence / Notes |
|---|---|---|
| `@nexuse/catalog` shared package (categories, search-param parsing, Loadable state model, wishlist logic, price/time formatting, repository contract, feature flags) | 🟡 | 19/19 tests passed (stand-in runner); typecheck clean (TS 7.0.2). |
| `apps/web` Next.js storefront: layout, header + category nav, home, search + filters + pagination, category pages, product detail, wishlist, account, sign-in info page, sell form, safety tips | 📝 | Written. Server-rendered smoke test of cards/results/states/filter/header/account passed (10 checks). **Not** built, type-checked, or opened in a browser; responsive layout and accessibility are unverified by test. |
| Loading / empty / error / offline states (web) | 🟡 | Skeleton, empty, unavailable, offline-with-retry states render (smoke test). Offline banner relies on browser `online/offline` events: untested. |
| `apps/mobile` Expo Android app: tabs (Home, Categories, Sell, Wishlist, Account), search, category, product, states, offline banner (NetInfo), image picker | 📝 | Written only. Never compiled, type-checked or run on a device/emulator. |
| Shared package integration | 📝 | Both apps import `@nexuse/catalog|domain|tokens|validation` via `workspace:*`. Metro/Next resolution of workspace TS sources unverified. |
| Branding assets | 🟡 | Original NEXUSE GO mark (SVG; PNG icons generated with sharp). Icons not visually reviewed on device. |
| Wishlist | 📝 | Device-local only (localStorage / AsyncStorage). Pure logic tested; storage wiring untested. |
| Sell entry | 📝 | Form validates with shared schemas; photo type/size/magic-byte checks (web). **Publishing is disabled by design.** |
| Real listings / backend | ⬜ | None. Every listing request returns "not connected". No demo products anywhere in app code (test fixtures live only in test files). |
| Sign-in / OTP | ⬜ | Not implemented. No fake OTP or placeholder auth; UI says so. |
| Search / filtering server-side | ⬜ | UI + URL parsing done; no data source. |
| Android package id | ⚠️ | `com.nexusego.app` is a placeholder; decide before first store build (cannot change later). |
| Lint | ⬜ | Still placeholder `echo` scripts (planned Batch 5). |
| Batches 3–10 | ⬜ | Supabase schema/RLS/auth/storage, real repository, chat, moderation, checkout flag, release. |

## Feature truth table (`@nexuse/catalog` FEATURES)
All `false`: browseListings, accountSignIn, publishListing, syncedWishlist, chat, checkout. A test asserts none is enabled before implementation.

## Batch 3 (see PROJECT_STATUS.md for the authoritative status)
| Item | Status | Evidence |
|---|---|---|
| Community config + scoped categories (catalog) | 🟡 | 24/24 catalog tests (stand-in runner) |
| Commission + roles logic (domain) | 🟡 | 16/16 domain tests (stand-in runner) |
| Supabase migrations 0001–0003 + seed | 🟡 | applied twice on Postgres 16 + Supabase *emulation shim*; never on real Supabase |
| RLS/authorization/messaging/community/audit tests | 🟡 | 116/116 pass on the emulation; 9 failures when 3 rules were deliberately broken |
| Apps read communities/categories from DB | ⬜ | static config only |
| Admin dashboard | ⬜ | |
| Auth/OTP | ⬜ | |
