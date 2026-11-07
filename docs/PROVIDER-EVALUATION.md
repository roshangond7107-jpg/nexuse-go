# SMS (MSG91 vs Twilio) and CAPTCHA — evaluation plan (decisions D1/D2: not selected)
This is a **checklist to complete before implementation**, not a comparison of facts. Vendor claims below are deliberately left blank where I have not verified them from current vendor documentation; do not treat any blank as a finding.

## Modular design (applies to either provider)
- Auth stays in Supabase Auth. Two integration routes (verify which your plan supports in current Supabase docs): (a) a provider **natively supported by Supabase Auth** configured in the dashboard; (b) the **Send-SMS auth hook** (Edge Function) that calls our own `SmsProvider` adapter.
- Adapter interface (route b): `interface SmsProvider { id: string; sendOtp(input:{ phoneE164:string; message:string; templateId?:string }): Promise<{ providerMessageId:string }>; }` with `msg91.ts`, `twilio.ts`; selected by env `SMS_PROVIDER`; no provider SDK or secret in apps; secrets only in Edge Function secrets.
- CAPTCHA: apps use a `CaptchaWidget` abstraction that yields an opaque token; verification is server-side (Supabase Auth CAPTCHA setting or in the hook). Switching vendor = config + one widget adapter.

## Evaluation criteria (fill from vendor pages / sales / a pilot)
| Criterion | MSG91 | Twilio | How to verify |
|---|---|---|---|
| Supported by Supabase Auth natively, or needs hook | ? | ? | Supabase Auth phone docs |
| India DLT: entity/header/template registration support & who files | ? | ? | vendor India docs/support |
| OTP delivery rate & latency to Jio/Airtel/Vi/BSNL | ? | ? | pilot with 100+ real test sends |
| Price per OTP SMS (INR), minimums, taxes | ? | ? | current price pages / quote |
| Data location, DPA, sub-processors (DPDP cross-border) | ? | ? | DPA documents |
| Fraud protection (SMS pumping/toll fraud), geo-permissions, rate-limit controls | ? | ? | docs |
| Delivery reports/webhooks, retries, fallback channel | ? | ? | docs |
| Test numbers / sandbox for CI | ? | ? | docs |
| Support responsiveness, SLA | ? | ? | sales |
| Lock-in/switch cost | low via adapter | low via adapter | design |
Outcome: record the decision, date, evidence links and the DLT template IDs in `docs/DECISIONS.md`.

## CAPTCHA candidates to evaluate: hCaptcha, Cloudflare Turnstile (verify current Supabase-supported set), others
Criteria: privacy/DPDP stance, accessibility (WCAG, audio alternative), mobile WebView/React Native support, cost, bot efficacy, Supabase native support.
