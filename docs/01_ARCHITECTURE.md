# 01_ARCHITECTURE.md

## 1. System Overview & Technical Stack

Lixxon Deconstruct is engineered as a zero-maintenance, cloud-native serverless application. It runs 100% independently of local compute, requiring zero local background daemons or resident server processes.

```text
                                 [ Client Browser ]
                                         │
                         HTTPS Request / Payload / File
                                         │
                                         ▼
                            [ Vercel Edge / CDN Layer ]
                                         │
                         Route Handler Execution (Next.js)
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼                      ▼                      ▼
        [ Sanitization Engine ]    [ Supabase Auth & DB ] [ Payment Webhook ]
        Strips Auth/Cookies/PII    Quota check / Credits  Lemon Squeezy/Stripe
                  │                      │
                  └──────────┬───────────┘
                             │
                             ▼
               [ Google GenAI SDK (@google/genai) ]
                 Gemini Flash Serverless Runtime
                             │
                             ▼
                 [ Structured Output Stream ]
                 OpenAPI 3.0 / Tailwind TSX / Python
Core TechnologiesFramework: Next.js (App Router), React, TypeScript (Strict Mode).Styling & UI: Tailwind CSS, Lucide React icons, @radix-ui primitives for accessible modals and tabs.Serverless Execution: Vercel Serverless Functions (nodejs runtime).AI & Reasoning Engine: @google/genai SDK using gemini-3.8-flash for high-throughput, low-latency code and schema synthesis.Database, Auth & Realtime: Supabase (@supabase/ssr + @supabase/supabase-js) utilizing PostgreSQL with Row-Level Security (RLS).Billing & Webhooks: Lemon Squeezy (Merchant of Record) or Stripe Checkout with HMAC signature validation.State & Data Fetching: React Hooks + SWR / Server Actions; client-side optimistic quota caching via localStorage.2. Directory & File Tree StructurePlaintextteardown-engine/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── docs/
│   ├── 00_PROJECT_VISION.md
│   ├── 01_ARCHITECTURE.md
│   ├── 02_DATA_SCHEMAS.md
│   ├── 03_ROADMAP_MILESTONES.md
│   ├── 04_PROMPTS_AND_REASONING.md
│   └── 05_AGENT_PROTOCOL.md
├── public/
│   ├── favicon.ico
│   └── logo.svg
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── auth/
    │   │   ├── callback/route.ts
    │   │   └── page.tsx
    │   ├── dashboard/
    │   │   ├── page.tsx
    │   │   └── history/page.tsx
    │   └── api/
    │       ├── deconstruct/
    │       │   ├── forge/route.ts
    │       │   ├── cleanroom/route.ts
    │       │   ├── logic/route.ts
    │       │   └── spy/route.ts
    │       ├── user/
    │       │   └── quota/route.ts
    │       └── webhooks/
    │           └── payment/route.ts
    ├── components/
    │   ├── common/
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── UpgradeModal.tsx
    │   ├── dashboard/
    │   │   ├── ConsoleInput.tsx
    │   │   ├── ModuleSelector.tsx
    │   │   ├── CodeViewer.tsx
    │   │   └── LivePreview.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Dialog.tsx
    │       ├── Tabs.tsx
    │       └── Toast.tsx
    ├── lib/
    │   ├── ai/
    │   │   ├── gemini-client.ts
    │   │   ├── formatters.ts
    │   │   └── parsers.ts
    │   ├── sanitizers/
    │   │   ├── har-sanitizer.ts
    │   │   └── code-sanitizer.ts
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   ├── server.ts
    │   │   └── middleware.ts
    │   └── utils.ts
    ├── middleware.ts
    └── types/
        ├── deconstruct.ts
        ├── database.ts
        └── payments.ts
3. Component Architecture & End-to-End PipelinePipeline SequencePayload Ingestion: The client dashboard receives either:A raw pasted string (HTML, JS, cURL, minified functions).A .har file dropped via file upload.An API URL with sample headers.Client-Side Pre-Validation:Payload size validated ($< 5\text{MB}$ allowed on client).Free-tier quota checked against localStorage and Supabase session. If usage $\ge 2$ and no active plan exists, display UpgradeModal.tsx.Local/Edge Sanitization:har-sanitizer.ts parses HTTP archives and strips Cookie, Authorization, Bearer, Set-Cookie, X-Api-Key, and sensitive query strings.Serverless Route Execution:The route validates user authentication and deducts 1 credit inside a Supabase Postgres transaction (decrement_user_credits).The route builds the prompt pipeline using the specific module definition in docs/04_PROMPTS_AND_REASONING.md.Invokes Google GenAI SDK:TypeScriptimport { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
Streaming / Parsing Response:The response is validated for JSON/TSX syntax conformance.Metadata (token usage, execution time, module type) is logged to Supabase jobs table.Formatted code is returned to the user interface.4. Serverless API Endpoint SpecificationsA. POST /api/deconstruct/forgeTransforms network captures, cURL sequences, or .har logs into clean OpenAPI 3.0 specs and SDKs.Payload:JSON{
  "rawHarOrNetwork": "string",
  "targetLanguage": "typescript" | "python",
  "generateSdk": boolean
}
Response:JSON{
  "success": true,
  "openApiSpec": "openapi: 3.0.0 ...",
  "sdkCode": "export class GeneratedClient { ... }",
  "endpointsExtracted": 4,
  "creditsRemaining": 18
}
B. POST /api/deconstruct/cleanroomDecompiles minified HTML/CSS bundles into responsive Tailwind CSS components.Payload:JSON{
  "rawMarkup": "string",
  "targetFramework": "react" | "vue",
  "componentName": "string"
}
Response:JSON{
  "success": true,
  "code": "export default function Component() { ... }",
  "detectedTokens": {
    "colors": ["#0F172A", "#38BDF8"],
    "spacing": "compact",
    "font": "Inter"
  },
  "creditsRemaining": 18
}
C. POST /api/deconstruct/logicExtracts business formulas, state machine transitions, and algorithms from legacy code.Payload:JSON{
  "legacySnippet": "string",
  "sourceFormat": "dotnet" | "wasm" | "legacy-js" | "pseudo",
  "targetLanguage": "typescript" | "python"
}
Response:JSON{
  "success": true,
  "modernizedLogic": "string",
  "unitTests": "describe('businessLogic', () => { ... })",
  "creditsRemaining": 18
}
D. POST /api/deconstruct/spyDeconstructs multi-turn prompt chains and AI model routing mechanisms from network traces.Payload:JSON{
  "networkTrace": "string"
}
Response:JSON{
  "success": true,
  "detectedModel": "gemini-3.8-flash / gpt-4o",
  "systemInstructions": "string",
  "parameterConfig": { "temperature": 0.2, "topP": 0.95 },
  "pipelineGraph": "mermaid / json schema",
  "creditsRemaining": 18
}
E. POST /api/webhooks/paymentReceives payment gateway notifications from Lemon Squeezy or Stripe.Security: Verifies HMAC-SHA256 signature against PAYMENT_WEBHOOK_SECRET.Actions:order_created / checkout.session.completed: Upgrades user tier and credits account balance.subscription_updated: Updates subscription status in users table.5. Security, Sanitization & Clean-Room BoundariesTo safeguard user privacy and prevent credential leakage:Pre-LLM Token Stripping: No Authorization, Cookie, or API Key tokens ever reach the Google Gemini API. The har-sanitizer.ts pipeline replaces all secret values with synthetic placeholders (e.g., Bearer test_sanitized_token_xyz).No Persistent Payload Logging: Raw input payloads are discarded after processing. Only sanitized summaries and output artifacts are saved if the user chooses to save them to their dashboard history.Stateless Edge Execution: Serverless functions do not share memory across invocations, guaranteeing tenant isolation.6. Environment Variables (.env.local.example)Bash# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Lixxon Deconstruct"

# Google GenAI API (Server-side only)
GEMINI_API_KEY=AIzaSy...

# Supabase (Auth, RLS, DB)
NEXT_PUBLIC_SUPABASE_URL=[https://xyzcompany.supabase.co](https://xyzcompany.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Billing & Merchant of Record (Lemon Squeezy / Stripe)
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
# Or Stripe equivalents:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
7. Operational Guidelines for Google AntigravityWhen executing the build:Never import @google/genai on client components ('use client'). AI execution is strictly confined to src/app/api/deconstruct/*.Database operations must use @supabase/ssr server utilities (src/lib/supabase/server.ts) inside API routes.All code modifications must keep bundle sizes minimal to comply with Vercel serverless free limits.
<ElicitationsGroup message="Next documentation files to complete for your /docs directory:">
  <Elicitation label="Generate complete content for docs/02_DATA_SCHEMAS.md" query="Write the complete SQL migration and TypeScript type definitions for docs/02_DATA_SCHEMAS.md."/>
  <Elicitation label="Generate complete content for docs/05_AGENT_PROTOCOL.md" query="Write the complete rules and step-by-step state machine for docs/05_AGENT_PROTOCOL.md to guide Antigravity during implementation."/>
</ElicitationsGroup>