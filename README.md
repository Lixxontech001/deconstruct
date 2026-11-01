# Lixxon Deconstruct

> **Zero-Local-Compute Developer Reverse Intelligence Engine**  
> Transform raw HTTP/.har captures, minified frontend bundles, legacy algorithms, and AI network traces into clean OpenAPI 3.0 specs + SDKs, responsive React TSX + Tailwind CSS, modern unit-tested TypeScript/Python, and prompt blueprints.

---

## ⚡ Core Modules

1. **Lixxon Forge (`/api/deconstruct/forge`)**
   * **Input:** Raw HTTP traffic or browser `.har` network archives.
   * **Output:** Validated OpenAPI 3.0 specification + type-safe client SDK (`TypeScript` or `Python`).
   * **Sanitization:** In-memory stripping of `Authorization` tokens, sensitive cookie headers, and static asset bloat.

2. **Lixxon CleanRoom (`/api/deconstruct/cleanroom`)**
   * **Input:** Minified DOM extracts, HTML markup, and CSS bundles.
   * **Output:** Clean, responsive React TSX component tree styled with Tailwind CSS + extracted design tokens.
   * **Sanitization:** Strips `<script>`, inline event handlers, base64 data URIs, and SVG bloat.

3. **Lixxon Logic (`/api/deconstruct/logic`)**
   * **Input:** Legacy, minified, or obfuscated algorithmic routines.
   * **Output:** Idiomatic, modernized TypeScript or Python routines + comprehensive unit test suites + documented business logic invariants.

4. **Lixxon Spy (`/api/deconstruct/spy`)**
   * **Input:** Raw JSON/HTTP network intercepts to LLM inference endpoints.
   * **Output:** Deconstructed system instruction template with `{{variables}}`, model parameter settings, and multi-step execution graphs.

---

## 🏗️ Architecture & Technology Stack

* **Framework:** Next.js 16 (App Router), React 19, TypeScript (Strict Mode).
* **Styling & Aesthetics:** Vanilla Tailwind CSS with custom dark industrial palette (`#09090b`, `#27272a`, `#10b981`), Lucide React icons.
* **AI Engine:** Google GenAI SDK (`@google/genai`) using `gemini-3.8-flash` for high-throughput, deterministic structured schema synthesis.
* **Database & Auth:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`) utilizing PostgreSQL with Row-Level Security (RLS) and atomic credit accounting RPCs.
* **Billing & Idempotency:** Stripe & Lemon Squeezy webhook handlers with HMAC-SHA256 signature verification and replay protection.
* **Execution Boundary:** Stateless Vercel Serverless Functions with zero local background service requirements.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
* Node.js v20+ (Node.js 22+ recommended)
* A Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
* A Supabase Project ([supabase.com](https://supabase.com/))

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate the required environment variables:
```env
# Google GenAI API
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webhooks & Billing (Stripe / Lemon Squeezy)
PAYMENT_WEBHOOK_SECRET=whsec_your_webhook_secret
```

*(Note: For offline testing without active Gemini API keys, set `MOCK_AI=true`.)*

### 3. Database Schema Setup
Execute the migration script in [`docs/02_DATA_SCHEMAS.md`](docs/02_DATA_SCHEMAS.md) or run the SQL in your Supabase SQL Editor:
* Creates tables: `public.profiles`, `public.jobs`, `public.orders`.
* Provisions transactional RPCs: `decrement_user_credits` and `fulfill_user_order`.
* Enables Row-Level Security (RLS).

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the Lixxon Studio Console.

---

## 🧪 Verification & Quality Gates

The codebase strictly enforces 3-level deterministic verification gates:

```bash
# Level 1: TypeScript Compiler Audit (0 errors)
npx tsc --noEmit

# Level 2: ESLint Production Rule Audit (0 errors, 0 warnings)
npm run lint

# Level 3: Full Production Serverless Build
npm run build
```

---

## 🚢 Deploying to Vercel

1. **Import Repository:** Connect the Git repository to [Vercel](https://vercel.com).
2. **Framework Preset:** Select `Next.js`.
3. **Environment Variables:** Add the following production variables in Vercel Project Settings:
   * `GEMINI_API_KEY`
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `PAYMENT_WEBHOOK_SECRET`
4. **Deploy:** Trigger production build. Vercel automatically deploys all API handlers as isolated serverless functions.
5. **Configure Webhook Endpoints:**
   * In your Stripe or Lemon Squeezy dashboard, set the webhook listener URL to:  
     `https://your-domain.vercel.app/api/webhooks/payment`
   * Set the webhook secret to match `PAYMENT_WEBHOOK_SECRET`.

---

## 🛡️ Clean-Room Principles & Security Invariants

* **Pre-LLM Token Stripping:** No credentials, bearer tokens, or sensitive cookies are ever transmitted to external LLM providers.
* **Ephemeral Ingestion:** Raw client captures are sanitized in memory and never persisted raw to databases.
* **Deterministic Output:** Structured JSON Schemas strictly constrain LLM generation, eliminating hallucinations and ensuring type correctness.
* **Tenant Isolation:** Stateless serverless execution ensures zero shared execution memory across invocations.

---

## 📄 License
MIT © 2026 Lixxon Architecture
