# Provisional decisions (owner, 2026-11-07) and what they mean for the code
Status: PROVISIONAL. "Impact" lists exactly what must change in Batch 4+. **No source code, migration or test was changed to apply these decisions yet** (the owner asked to fix the verification workflow first).

| # | Decision | Impact on existing project | Impact on Batch 4 design |
|---|---|---|---|
| D1 | SMS provider **not selected**; keep integration modular; compare MSG91 vs Twilio before implementing | none yet | Provider chosen at Supabase level (native Twilio) or via a **Send-SMS hook Edge Function** with an adapter interface; no provider SDK in apps. See `docs/PROVIDER-EVALUATION.md` |
| D2 | CAPTCHA **not selected**; provider-independent | none yet | `CaptchaWidget` interface in apps returns an opaque token; server verification configured in Supabase Auth (or in the hook). Vendor = config, not code |
| D3 | **Do not collect or retain date of birth** until data-minimisation/legal review | **CONFLICT with current code** (below) | Remove DOB from onboarding; use the age-gate options in `docs/AGE-VERIFICATION-REQUIREMENTS.md`; launch **18+ only** |
| D4 | Guardian consent: **design only; do not activate** until legally reviewed | `guardian_verified` column + minor rules exist in DB (inactive in practice: no minor can register) | `docs/GUARDIAN-CONSENT-WORKFLOW.md`; guarded by a flag that is `false`; no UI route shipped |
| D5 | **Admin MFA mandatory for all administrative accounts** (moderators and admins) | not enforced yet (roles work without MFA) | Enforce in the DATABASE: `is_moderator()/is_admin()` require JWT `aal = 'aal2'` (migration 0004, tightening) + tests; UI enrolment flow |
| D6 | Supabase region: **prefer Mumbai** (`ap-south-1`) subject to availability + data-location review | none | Supabase's regions page lists "South Asia (Mumbai)" (checked 2026-11-07 via docs). Confirm per-project availability when creating it, and review SMS provider / Edge Function / backup locations too |
| D7 | Android package id provisionally `com.nexusego.app` | already set in `app.json` | Verify availability and ownership before the first store upload (cannot change afterwards) |
| D8 | Listing photos: **private storage + signed URLs**, with server-side validation and EXIF/GPS stripping | migration 0003 currently makes `listing-images` **public** (so URLs work) — this is a known gap | Migration 0006 makes the bucket private and adds visibility-based SELECT policy; see `docs/BATCH-4-ARCHITECTURE.md` §6 (amended) |
| — | Students remain the only active community; no payment collection; no fake OTP; no demo listings | unchanged | unchanged |

## D3 conflict: exactly what in the current project collects/uses DOB
(All to be changed in Batch 4; recorded here so nothing is missed. No data exists anywhere: nothing has been deployed.)
- `supabase/migrations/0001_core_schema.sql` — `profiles.date_of_birth NOT NULL`, `is_minor`, `guardian_verified`, trigger `profiles_before_insert` derives `is_minor` from DOB.
- `supabase/migrations/0002_security_rls.sql` — `can_participate()` uses `is_minor`/`guardian_verified`; grants `INSERT (… date_of_birth …)` on profiles.
- `supabase/tests/rls_tests.sql` — profile fixtures insert DOB; minor/guardian tests.
- `packages/validation/src/index.ts` — `profileSchema` requires `dateOfBirth`, derives `isMinor`; `packages/validation/src/validation.test.ts` tests it.
- `packages/domain/src/age.ts` (+ tests) — DOB-based age maths and capability matrix.
- `apps/web/app/safety/page.tsx` — mentions under-18 guidance (text only).
- Docs: compliance checklist, Batch 4 architecture §4.
**Planned change (migration 0004 + code), not yet made:** drop `date_of_birth`; replace with `adult_declared_at timestamptz` (or nothing, per legal review) — see age options; keep `guardian_verified` but unreachable (no minor accounts exist at launch); update `can_participate()`; rewrite affected tests; keep the 116-test suite green and add tests proving DOB cannot be stored.

## D5 note on bootstrap
Because MFA is enforced by the database for staff, the first admin must (1) sign in, (2) enrol TOTP, (3) only then be granted a role by service-role SQL; until the session is `aal2` the role confers no access. Tests must prove an `aal1` staff JWT is denied everywhere an `aal2` one is allowed.
