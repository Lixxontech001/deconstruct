# 03_ROADMAP_MILESTONES.md

## 1. Operating Instructions for Autonomous Agents

This document is the state-machine and execution log for autonomous coding agents (Google Antigravity, Claude Code, Cursor, Codex). 

### Execution Protocol
1. **Strict Single-Task Lock:** Work on only **one unchecked checkbox (`- [ ]`)** at a time. Do not jump ahead or bundle multiple tasks into a single run.
2. **Deterministic Verification:** Before marking any task as complete, verify that the application compiles without TypeScript or build errors via `npm run build` or the relevant test script.
3. **State Mutation:** When a task is verified and passing, update its status from `- [ ]` to `- [x]`.
4. **Handoff Report:** Provide a concise summary of:
   * Files created or modified.
   * Verification steps executed and output status.
   * The exact next item queued for implementation.
5. **Wait for Confirmation:** Pause execution and request developer authorization before moving to the next item.

---

## 2. Phase 1: Foundation, Dependencies & Type System

- [x] **Task 1.1: Project Scaffolding & Base Tooling**
  * Initialize Next.js (App Router) with TypeScript, Tailwind CSS, and ESLint.
  * Verify `package.json` includes required production dependencies:
    * `@google/genai` (Official Google GenAI SDK)
    * `@supabase/ssr` and `@supabase/supabase-js`
    * `lucide-react` (Interface iconography)
    * `clsx` and `tailwind-merge` (Class name management)
    * `@radix-ui/react-dialog` and `@radix-ui/react-tabs`
  * Add development dependencies: `prettier`, `prettier-plugin-tailwindcss`.
  * *Verification:* Run `npm run build` to verify clean baseline compilation.

- [x] **Task 1.2: Environment Configuration & Public Assets**
  * Create `.env.example` matching the variable catalog in `01_ARCHITECTURE.md`.
  * Create `src/lib/utils.ts` with `cn()` utility function (`clsx` + `tailwind-merge`).
  * Verify Tailwind configuration in `tailwind.config.ts` includes container styling, slate/zinc dark mode palette, and animation primitives.
  * *Verification:* Verify `src/lib/utils.ts` exports cleanly with zero TypeScript errors.

- [x] **Task 1.3: Data Contracts & TypeScript Declarations**
  * Create `src/types/database.ts` using the exact contracts defined in `02_DATA_SCHEMAS.md`.
  * Create `src/types/deconstruct.ts` for all module requests, artifacts, and unified response wrappers.
  * *Verification:* Run `npx tsc --noEmit` to confirm complete type resolution.

---

## 3. Phase 2: Ingestion & Sanitization Engine

- [x] **Task 2.1: In-Memory HTTP Archive (.har) Sanitizer**
  * Create `src/lib/sanitizers/har-sanitizer.ts`.
  * Implement `sanitizeHarPayload(rawContent: string)`:
    * Recursively redact values for sensitive headers: `Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key`, `X-Auth-Token`, `Bearer *`.
    * Redact sensitive query parameters: `token`, `key`, `apiKey`, `secret`, `password`, `session`.
    * Filter out static asset requests (`.png`, `.jpg`, `.svg`, `.woff2`, `.css`, analytics/tracking pixels).
    * Strip response bodies exceeding 50KB to preserve token context limits.
  * *Verification:* Unit test with a mock `.har` string containing dummy bearer tokens and verify tokens are replaced with synthetic placeholders.

- [x] **Task 2.2: Frontend Markup & Script Cleaner**
  * Create `src/lib/sanitizers/code-sanitizer.ts`.
  * Implement `cleanInputMarkup(rawContent: string)`:
    * Strip `<script>` tags, base64 data URIs, and SVG path bloat while retaining class structures, layout nodes, and text content.
    * Enforce a hard ceiling of 200,000 characters to prevent serverless payload timeouts.
  * *Verification:* Test with raw minified HTML; verify external tracking scripts and base64 strings are purged cleanly.

---

## 4. Phase 3: Serverless Extraction Handlers (`@google/genai`)

- [x] **Task 3.1: Google GenAI Client Wrapper**
  * Create `src/lib/ai/gemini-client.ts`.
  * Initialize `GoogleGenAI` instance using `process.env.GEMINI_API_KEY`.
  * Implement helper `generateDeconstruction({ systemInstruction, prompt, schema, temperature })`.
  * Configure model target: `gemini-2.5-flash`.
  * Ensure system prompts match specifications in `04_PROMPTS_AND_REASONING.md`.
  * *Verification:* Invoke `gemini-client.ts` with a mock prompt in a test script; assert structured response returns without network or SDK exceptions.

- [x] **Task 3.2: Lixxon Forge Route (`/api/deconstruct/forge`)**
  * Create `src/app/api/deconstruct/forge/route.ts`.
  * Accept POST with `rawHarOrPayload`, `targetLanguage`, and `generateSdk`.
  * Pass payload through `har-sanitizer.ts`.
  * Call Gemini client with Forge system instructions and schema definitions.
  * Validate JSON output matching `ForgeArtifact` interface.
  * *Verification:* Send a POST request via cURL with dummy JSON API traffic; verify returned payload contains valid OpenAPI 3.0 JSON and SDK code.

- [x] **Task 3.3: Lixxon CleanRoom UI Route (`/api/deconstruct/cleanroom`)**
  * Create `src/app/api/deconstruct/cleanroom/route.ts`.
  * Accept POST with `rawMarkup`, `targetFramework`, and `componentName`.
  * Pass input through `code-sanitizer.ts`.
  * Call Gemini client with CleanRoom instructions to synthesize TSX + Tailwind CSS.
  * *Verification:* Send minified HTML; assert output returns valid React JSX/TSX with modern Tailwind classes.

- [x] **Task 3.4: Lixxon Logic Route (`/api/deconstruct/logic`)**
  * Create `src/app/api/deconstruct/logic/route.ts`.
  * Accept POST with `legacySnippet`, `sourceFormat`, and `targetLanguage`.
  * Call Gemini client with Logic extraction instructions to decouple algorithms and output unit tests.
  * *Verification:* Send a sample legacy algorithmic function; confirm output includes clean target code and comprehensive test cases.

- [x] **Task 3.5: Lixxon Spy Route (`/api/deconstruct/spy`)**
  * Create `src/app/api/deconstruct/spy/route.ts`.
  * Accept POST with `networkTrace`.
  * Deconstruct prompt orchestration, parameters (temperature/topP), and agent execution graphs.
  * *Verification:* Send a sample LLM request/response trace; verify returned artifact extracts prompt template variables and model parameters.

---

## 5. Phase 4: Client Dashboard & UI Components

- [x] **Task 4.1: Root Layout & Design Tokens**
  * Create `src/app/layout.tsx` and `src/app/globals.css`.
  * Implement dark-themed industrial aesthetic: zinc/slate dark surfaces (`#09090b`), high-contrast borders (`#27272a`), emerald accents (`#10b981`), and monospace code accents.
  * Implement `src/components/common/Header.tsx` displaying the Lixxon Studio brand, credit badge, and external documentation link.
  * Implement `src/components/common/Footer.tsx`.
  * *Verification:* Confirm layout renders responsively on mobile and desktop viewports.

- [x] **Task 4.2: Studio Console Input (`ConsoleInput.tsx`)**
  * Create `src/components/dashboard/ConsoleInput.tsx`.
  * Build multi-input controls:
    * Raw code/markup paste textarea with line numbering.
    * Drag-and-drop file upload zone for `.har`, `.json`, `.txt`, and `.html` files.
    * Target framework/language toggles (TypeScript vs. Python, React vs. Vue).
  * Add client-side size verification ($< 5\text{MB}$) and error feedback.
  * *Verification:* Test file drag-and-drop and manual text entry across desktop and mobile screen sizes.

- [x] **Task 4.3: Module Selector & State Controller (`ModuleSelector.tsx`)**
  * Create `src/components/dashboard/ModuleSelector.tsx`.
  * Build a 4-tab segmented switch:
    * `Lixxon Forge` (API & OpenAPI)
    * `Lixxon CleanRoom` (Frontend to Tailwind)
    * `Lixxon Logic` (Legacy-to-Cloud)
    * `Lixxon Spy` (AI Prompt Deconstruct)
  * Bind active tab state to parent console controller.
  * *Verification:* Tab switching updates input placeholders, file-drop rules, and target endpoint routes instantly.

- [x] **Task 4.4: Code Viewer & Artifact Exporter (`CodeViewer.tsx`)**
  * Create `src/components/dashboard/CodeViewer.tsx`.
  * Features:
    * Monospace code view with formatted line wraps.
    * One-click "Copy Code" action with visual confirmation.
    * "Download Artifact" button (outputs `.tsx`, `.py`, or `.json` based on active module).
    * Sub-tab switcher to toggle between generated code, OpenAPI schema, and unit tests.
  * *Verification:* Verify copy action writes accurately to system clipboard and file download generates properly formatted files.

- [x] **Task 4.5: Studio Dashboard Main Page (`src/app/page.tsx`)**
  * Wire `Header`, `ModuleSelector`, `ConsoleInput`, and `CodeViewer` into `src/app/page.tsx`.
  * Manage end-to-end execution lifecycle:
    * `idle` $\rightarrow$ `loading` (animated execution skeleton) $\rightarrow$ `success` $\rightarrow$ `error`.
  * Implement execution timer badge (`Execution completed in 1.4s`).
  * *Verification:* Execute live end-to-end extraction from the UI against the local serverless routes.

---

## 6. Phase 5: Identity, Quotas & Supabase Integration

- [x] **Task 5.1: Supabase SSR Client Helpers**
  * Create `src/lib/supabase/client.ts` using `createBrowserClient`.
  * Create `src/lib/supabase/server.ts` using `createServerClient` with Next.js cookie stores.
  * Create `src/middleware.ts` to refresh user auth sessions across edge boundaries.
  * *Verification:* Confirm cookie handling runs cleanly in Next.js middleware without header mutation errors.

- [x] **Task 5.2: Anonymous Quota Fallback & Local Storage Bridge**
  * Implement client-side quota utility in `src/lib/quota.ts`.
  * If user is unauthenticated:
    * Read `lixxon_anon_runs` from `localStorage`.
    * Allow 2 free generations.
    * Increment counter upon successful job completion.
    * When count reaches 2, trigger `UpgradeModal.tsx`.
  * If user is authenticated:
    * Read live credit balance from Supabase `public.profiles`.
  * *Verification:* Trigger 2 test runs in an incognito window; verify the 3rd run is blocked by the quota modal.

- [x] **Task 5.3: Upgrade Modal & Scarcity Banner (`UpgradeModal.tsx`)**
  * Create `src/components/common/UpgradeModal.tsx`.
  * Display tier cards:
    * **Single Export Pass ($19)** - 5 extra deconstructions.
    * **Founder Lifetime ($99)** - Unlimited access (displays dynamic counter: "Capped at 50 early builders").
    * **Builder Pro ($79/mo)** - 100 deconstructions/month.
  * Embed direct checkout buttons wired to Stripe / Lemon Squeezy checkout URLs.
  * *Verification:* Verify modal displays correctly upon limit breach and renders checkout actions responsively.

- [x] **Task 5.4: Deduct Credits RPC Endpoint**
  * Create `src/app/api/user/quota/route.ts`.
  * Check current session. If authenticated, call PostgreSQL function `decrement_user_credits`.
  * If credits are insufficient ($< 1$) and plan is not `lifetime`, return HTTP 402 Payment Required.
  * Wire this check into all four deconstruct route handlers before triggering Gemini inference.
  * *Verification:* Assert that authenticated users with 0 credits receive HTTP 402 and API execution halts.

---

## 7. Phase 6: Payment Fulfillment & Webhooks

- [x] **Task 6.1: Payment Webhook Handler (`/api/webhooks/payment`)**
  * Create `src/app/api/webhooks/payment/route.ts`.
  * Support Lemon Squeezy and Stripe event payloads.
  * Validate HMAC-SHA256 signature against request headers using `PAYMENT_WEBHOOK_SECRET`.
  * On checkout completion (`order_created` or `checkout.session.completed`):
    * Extract customer email, user ID, tier purchased, and external order ID.
    * Call Supabase RPC `fulfill_user_order`.
  * Enforce idempotency: Duplicate webhook events with the same `external_order_id` must return HTTP 200 without double-crediting.
  * *Verification:* Send a mock signed webhook payload; assert `public.profiles` updates tier and credit balance.

- [x] **Task 6.2: Authentication & Post-Checkout Redirection**
  * Create `src/app/auth/page.tsx` for email magic links and GitHub OAuth.
  * Create `src/app/auth/callback/route.ts` to exchange auth codes for sessions.
  * Ensure post-checkout URLs return user directly to `/dashboard` with an active session toast.
  * *Verification:* Complete an auth flow and confirm clean redirection to the main dashboard.

---

## 8. Phase 7: Production Optimization & Deployment

- [x] **Task 7.1: Zero-Warning Build Audit**
  * Run `npm run lint` and resolve all ESLint warnings.
  * Run `npx tsc --noEmit` and resolve all type discrepancies.
  * Run `npm run build` to confirm static generation and serverless route bundles compile without warnings.
  * *Verification:* `npm run build` outputs green status across all routes.

- [x] **Task 7.2: Vercel Cloud Deployment & Production Verification**
  * Link GitHub repository to Vercel project.
  * Add production environment variables in Vercel project settings (`GEMINI_API_KEY`, Supabase keys, webhook secrets).
  * Trigger production deployment.
  * Verify live URL against all 4 modules using sample inputs.
  * *Verification:* Production URL responds with status 200, handles deconstruction requests, and successfully executes all client-side flows.