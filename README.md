# Claim What's Yours — Andhra Pradesh Welfare Scheme Navigator

A plain-language, Telugu-first welfare scheme navigator for **five beneficiary groups** in Andhra Pradesh, India:
1. Students & Mothers (`Thalliki Vandanam`, `Vidya Deevena`, `Nirudyoga Bruthi`)
2. Senior Citizens, Widows & Persons with Disabilities (`NTR Bharosa Pensions`)
3. Small & Marginal Farmers (`Annadata Sukhibhava`, `Micro Irrigation Subsidy`)
4. Women & Women Entrepreneurs (`Aadabidda Nidhi`, `Stree Shakti`, `Deepam 2.0`, `Digi-Lakshmi`)
5. Daily-Wage / Unorganised & Construction Worker Families (`AP Unorganised Worker Welfare`)

## Core Non-Negotiable Principles

- **Likely Eligibility Only:** Never claims "guaranteed" or "you qualify". Always explains the exact matched rule and closes with *"This is likely eligibility, not a guarantee."*
- **Zero Sensitive ID Numbers:** Never asks for or stores Aadhaar numbers, bank account numbers, or full ID numbers — only possession questions (*"Do you have a White Ration Card?"*).
- **Session-Only Profile:** The extracted JSON profile (`WelfareProfile`) exists strictly in session memory and is never written to disk or any remote database.
- **Deterministic Rules Engine (`check_eligibility`):** `src/engine/eligibilityEngine.ts` returns strictly `MATCH | NEEDS_INFORMATION | DOES_NOT_MATCH | UNVERIFIED`. AI never decides eligibility.
- **90-Day Verification Guardrail:** Any scheme whose `last_verified` date is more than 90 days old automatically displays `"verification pending — confirm at your Grama/Ward Sachivalayam"`.
- **Phone-Number Reminders Only:** `RemindersPage` accepts a 10-digit mobile number (explicitly blocking 12-digit Aadhaar inputs) for application deadlines, Super Six re-verification dates, and 30-day follow-ups.

## Local Development

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY in .env
npm run dev
```

Runs on `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Deploy on Cloudflare Pages

1. Connect your repository in **Cloudflare Dashboard → Workers & Pages → Create → Pages**.
2. Set **Build command** to `npm run build` and **Build output directory** to `dist`.
3. Add `GEMINI_API_KEY` as an environment secret and expose `/api/extract` via a Cloudflare Pages Function (`functions/api/extract.ts`) so the API key stays server-side.
