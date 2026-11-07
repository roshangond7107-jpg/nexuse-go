# Age-verification requirements (WORKING DOCUMENT — NOT LEGAL ADVICE)
Owner decision D3: do **not** collect or retain date of birth until data-minimisation and legal requirements are reviewed. This document records what the law appears to require, what is NOT yet confirmed, the options, and the interim launch posture.

## 1. What I could confirm (secondary sources, retrieved 2026-11-07 — verify against the official gazette text)
- India's **Digital Personal Data Protection Act, 2023** defines a *child* as a person **under 18**. Before processing a child's personal data a data fiduciary must obtain **verifiable consent of the parent/lawful guardian**, and must not undertake **tracking/behavioural monitoring of children or targeted advertising directed at children** (the Act also forbids processing likely to cause detrimental effect on a child's well-being).
- The **DPDP Rules, 2025** were notified on **14 November 2025** with an **18-month phased compliance period** (so most fiduciary obligations — including children's data — apply roughly from **May 2027**; confirm exact dates). Secondary summaries say the Rules require fiduciaries to verify the identity and age of the parent/guardian and carve out limited exemptions (e.g. certain healthcare, educational, child-safety/transport contexts). **Not confirmed here:** the rule numbers, the accepted verification methods (my recollection is that government-backed identity/age tokens such as a Digital Locker token are contemplated — unverified), and whether a marketplace falls in any exemption (it very likely does not).
- Sources: [PIB notification page](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf), [EY summary](https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025), [Seclore guide](https://www.seclore.com/fundamentals/dpdp-rules-2025-compliance-guide/), [MediaNama on child-tracking exemptions](https://www.medianama.com/2025/11/223-dpdp-rules-real-time-child-tracking-without-consent/).
- Separate from DPDP: **contract capacity** — in India a minor generally cannot enter a binding contract (Indian Contract Act 1872, s.11). A marketplace where under-18s sell goods or agree sales raises capacity and consumer-law questions independent of data protection. Ask counsel.
- **Google Play** has its own rules for apps that may be used by children; declare the target audience accurately.

## 2. Exact requirements the PRODUCT must meet (derived; to be validated by counsel)
R1. Never process personal data of a person under 18 unless verifiable guardian consent exists (or counsel confirms an exemption).
R2. Therefore the **default launch posture is 18+ only**: under-18s may browse anonymously (no account, no personal data, device-local wishlist only), but cannot register, sell, chat or upload.
R3. No behavioural tracking or targeted advertising for any user whose adulthood is not established (practically: no ad/analytics SDKs that profile users at launch).
R4. Age assurance must be proportionate to risk and **retain the minimum data**: store the outcome, not the evidence, wherever possible.
R5. Users must be told, in plain language, what age check is done, why, and what is kept.
R6. If an under-18 is later discovered (report, admin review), there must be a defined handling path: suspend the account, stop processing, delete data or obtain guardian consent as counsel advises. Document the process before launch.
R7. Phone-number verification is never evidence of age or of student status.

## 3. Options for the age gate without DOB (decision pending legal review)
| Option | What is stored | Assurance | Notes |
|---|---|---|---|
| A. **Self-declaration "I am 18 or older"** at sign-up (checkbox, not pre-ticked) | `adult_declared_at` timestamp (or nothing) | Low — user can lie | Cheapest; arguably insufficient on its own for DPDP "due diligence" once Rules apply; acceptable as interim only if counsel agrees. **Recommended interim default**, with R2 enforced by blocking features for non-declared users |
| B. Age band at sign-up (18–24, 25+, <18 → blocked) | band | Low | Adds no assurance over A; collects more than needed |
| C. Third-party / government-backed age token (e.g. DigiLocker-based) | pass/fail result only | High | Depends on the Rules' prescribed methods; integration cost; verify availability for private entities |
| D. Payment-instrument or OTP-to-guardian checks | outcome only | Medium | Payment collection is out of scope; guardian OTP belongs to the guardian workflow (inactive) |
Decision needed from counsel: is A sufficient for an 18+-only marketplace until May 2027, and which of C/D is required after?

## 4. Interim technical rules (to implement in Batch 4 after sign-off)
- Onboarding asks only for the 18+ declaration (Option A) — **no DOB field anywhere**; schema stores at most `adult_declared_at`.
- Users who do not declare 18+: no profile row is created; they remain anonymous browsers; the UI says guardian-enabled accounts are not available yet.
- Server-side gate: profile creation requires the declaration (CHECK constraint + RLS test); any later "minor" signal sets the account to `suspended` pending the R6 process.
- Telemetry: none that profiles users; Sentry (errors) only with PII scrubbing.
- Tests: schema must reject a `date_of_birth` column existing (information_schema check), profile insert without declaration is denied, and the 116-test suite stays green.

## 5. Open questions for counsel
1. Is a self-declaration acceptable under DPDP for an 18+-only service during the phase-in and after?
2. Which verification methods will the Rules/DPB accept for parent identity/age (needed for D4)?
3. Can minors sell/buy at all given contract capacity (even with guardian consent)? Should guardian-enabled accounts be buy-only?
4. Retention period for the declaration timestamp and for evidence of consent.
5. Exemptions: does any limb (education/safety) apply to a student-focused marketplace? (Assumed no.)
