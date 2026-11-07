# Legal & privacy compliance checklist (India) — WORKING DRAFT, NOT LEGAL ADVICE
Status legend: ⬜ not done · 🟡 partly (technical groundwork only) · ✅ done. **Nothing here is ✅; a qualified Indian lawyer must review before launch.**

## Digital Personal Data Protection Act, 2023 (and Rules as notified)
| Item | Status | Notes |
|---|---|---|
| Notice & consent at sign-up (plain language, purposes listed, language options) | ⬜ | `profiles.accepted_terms_at` stores acceptance time only; no notice text exists |
| Data minimisation | 🟡 | Owner decision D3: **no DOB collected or retained**. The *current schema still has `date_of_birth`* (nothing deployed, no data) and must be changed in migration 0004 — see `docs/DECISIONS.md`. Age gate options + legal questions: `docs/AGE-VERIFICATION-REQUIREMENTS.md` |
| Children (<18): verifiable parental/guardian consent; no tracking, behavioural monitoring or targeted ads | 🟡 | DB flags `is_minor`; minors cannot sell/chat/upload without `guardian_verified`; **no guardian verification flow exists** (design only: `docs/GUARDIAN-CONSENT-WORKFLOW.md`, inactive); launch posture 18+ only; app shows no targeted content. Legal review of the method is required |
| Purpose limitation, retention & deletion policy | ⬜ | no retention schedule; no account-deletion flow (FK cascades exist) |
| Data principal rights (access, correction, erasure, grievance, nominate) | ⬜ | no UI/process; no grievance officer named |
| Breach notification process | ⬜ | |
| Security safeguards | 🟡 | RLS + column grants (116 local tests pass on an emulated Supabase); not tested on real Supabase; no pen-test |
| Processors / cross-border transfer (Supabase region, SMS provider, analytics) | ⬜ | choose an India/Singapore region deliberately and document |
## Intermediary / marketplace obligations (IT Act 2000, Intermediary Rules 2021, Consumer Protection (E-Commerce) Rules 2020)
| Item | Status | Notes |
|---|---|---|
| Terms of Use, Privacy Policy, prohibited-items policy published | ⬜ | `/safety` page exists (tips only) |
| Grievance Officer + complaint SLA displayed | ⬜ | |
| Takedown / report handling workflow | 🟡 | `reports` table + moderation tables; no UI; no SLA tracking |
| Seller disclosures (name/contact/address on request), refund & return statements | ⬜ | initial model is buyer–seller direct; no payment protection is claimed |
| Prohibited items (stolen, counterfeit, illegal, dangerous) | 🟡 | advisory regex scan + moderation workflow; not a reliable filter |
## Payments / tax (future — nothing collects money today)
| Item | Status | Notes |
|---|---|---|
| 2% commission contract/terms; GST on commission; TDS/TCS (Sec. 194-O / GST TCS) as applicable | ⬜ | `@nexuse/domain` has a pure calculator only |
| Payment aggregator licensing / use of an RBI-authorised PA; seller KYC; payouts, refunds, disputes | ⬜ | |
## Communications
| Item | Status | Notes |
|---|---|---|
| SMS OTP: TRAI DLT entity/template registration, sender ID | ⬜ | required for Indian SMS delivery |
| Promotional messaging consent | ⬜ | none sent |
## App stores
| Item | Status | Notes |
|---|---|---|
| Google Play data-safety form, account-deletion URL, content rating, target-audience/Families policy (minors) | ⬜ | |
| Package id decision (`com.nexusego.app` is a placeholder) | ⬜ | immutable after first upload |
