# Guardian consent workflow — DESIGN ONLY, NOT ACTIVE (decision D4)
Nothing in this document is implemented or may be activated until counsel has reviewed it (see `docs/AGE-VERIFICATION-REQUIREMENTS.md`). At launch **no under-18 account can exist** (18+ only), so none of this runs.

## Activation guard
- New flag `FEATURES.guardianConsent = false` (to be added to `@nexuse/catalog` when the design is implemented; do not add UI routes before then).
- DB: a setting row `app_settings(key='guardian_consent_enabled', value=false)`; Edge Function and RLS helper both refuse to operate unless true. Turning it on is an admin action with MFA and an audit-log entry, plus a recorded legal-sign-off reference.

## Actors
Minor (child), Guardian (adult with own verified phone), Platform (Edge Functions with service role), Admin (MFA).

## State machine (`guardian_consents.status`)
`none → requested → guardian_contacted → guardian_verified → consented → active` ; side exits: `declined`, `expired` (14 days), `revoked` (guardian may withdraw any time → account suspended, data handling per policy), `suspended` (admin).

## Steps
1. Child (without declaring 18+) asks for a guardian-enabled account → collects the **minimum**: guardian's mobile number only (no child DOB — pending decision on whether any age data is needed).
2. Platform sends the guardian a message with a one-time link/code (provider-modular SMS adapter; CAPTCHA + rate limits).
3. Guardian verifies their phone (real OTP) and **proves they are an adult/identifiable** using the method counsel/Rules specify (Option C/D in the age document — undecided; placeholder interface `GuardianVerifier.verify(): Promise<{ok, evidenceRef}>`; no implementation until chosen).
4. Guardian reads the plain-language notice (what data, why, rights, how to withdraw) and records explicit consent; capture notice version + timestamp + guardian identifier reference.
5. Edge Function (service role) sets `guardian_verified = true` and writes a `guardian_consents` row + audit log. **Clients can never set it** (existing column grants already prevent this; tested).
6. Restricted capabilities even after consent (proposal for counsel): buy/chat only; **no selling** unless counsel confirms contract-capacity position; no targeted content or tracking; listings of minors never show full name/location precision.
7. Guardian can revoke via link/code at any time; revocation suspends the account immediately and starts data deletion per retention policy.

## Data model (additive migration, inactive)
`guardian_consents(id, child_user_id, guardian_phone_hash, status, notice_version, consented_at, revoked_at, evidence_ref, created_at)` — RLS: child sees own row minus phone hash; guardian has no DB identity (acts via signed link token); staff (aal2) read-only; writes by service role only. Store hashed guardian phone + minimal evidence reference, not raw proofs.

## Required before activation
Legal sign-off on method, notice text, retention; DLT-approved SMS template; Play Console "children"/audience declarations; admin runbook for revocation and for minors found on the platform; tests: every transition, expiry, revocation, privilege escalation attempts, RLS denial matrix for the new table.
