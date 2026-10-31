# 00_PROJECT_VISION.md

## 1. Executive Summary & Brand Identity
* **Project Name:** Lixxon Deconstruct
* **Engine Core:** Lixxon Reverse Engine (`lixxon-core`)
* **Parent Entity:** Lixxon Studio
* **Core Value Proposition:** Turn opaque web traffic, minified frontend bundles, and undocumented software logic into clean, production-ready code, schemas, and modern UI components with a two-click interface.

Lixxon Deconstruct is a developer intelligence platform engineered to eliminate manual software reverse engineering. By chaining serverless cloud execution with advanced LLM reasoning (powered by Gemini models), Lixxon Deconstruct inspects messy, obfuscated payloads and yields structured OpenAPI specifications, production-grade Tailwind CSS/React components, and modern business logic.

---

## 2. Core Market Problems & Opportunities

Enterprise teams, agencies, and indie developers routinely waste hundreds of engineering hours navigating four recurring bottlenecks:

1. **Undocumented API Silos:** Critical internal business tools, legacy CRMs, and niche platforms lack public developer APIs. Teams resort to manual data entry or fragile browser scrapers that break with every DOM update.
2. **Design & Frontend Rebuilding Friction:** Translating an existing user interface or design pattern from a production web app into maintainable Tailwind CSS and React code typically requires days of manual inspection and styling.
3. **Legacy Business Logic Entrapment:** Older business tools often contain proprietary formulas and workflow validation rules whose original source code is lost or trapped in legacy builds.
4. **AI Pipeline Opacity:** AI builders struggle to understand how top-tier AI applications structure their orchestration, system prompts, and context delivery.

---

## 3. Product Ecosystem Architecture

Lixxon Deconstruct addresses these problems through four specialized sub-modules built on a single unified interface:

```text
                           ┌───────────────────────────────┐
                           │      LIXXON DECONSTRUCT       │
                           │   (Unified Studio Dashboard)  │
                           └──────────────┬────────────────┘
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[ Lixxon Forge ]   [ Lixxon CleanRoom ]          [ Lixxon Logic ]    [ Lixxon Spy ]
HAR/Payload to     Minified bundle to            Legacy logic to     Model routing &
OpenAPI 3.0 & SDK  Tailwind CSS + React          modern Python/TS    system prompt maps
Module 1: Lixxon Forge (API & Schema Engine)
Input: Raw HTTP payloads, cURL commands, or browser .har network export logs.

Operation: Sanitizes private tokens/cookies, maps dynamic request/response parameters, identifies endpoint schemas, and aggregates query filters.

Output: Validated OpenAPI 3.0 YAML/JSON specifications and typed client SDKs (TypeScript & Python).

Module 2: Lixxon CleanRoom UI (Frontend Decompiler)
Input: Minified DOM extracts, CSS bundles, or component HTML snippets.

Operation: Strips noise, isolates design tokens (colors, spacing, typography scales), detects layout structures (Flexbox/Grid), and reconstructs interactive state models.

Output: Modular, clean, production-ready React (JSX/TSX) components styled exclusively with Tailwind CSS.

Module 3: Lixxon Logic (Legacy-to-Cloud Modernizer)
Input: Algorithmic routines, validation scripts, or decompiled pseudo-code from older applications.

Operation: Decouples core mathematical models, state machines, and data validation rules from obsolete frameworks.

Output: Idiomatic, unit-tested TypeScript or Python functions ready for cloud deployment.

Module 4: Lixxon Spy (AI Pipeline Deconstructor)
Input: Network logs of AI-driven web apps and agent interactions.

Operation: Traces message structures, system instructions, temperature settings, and multi-turn context boundaries.

Output: Clean architecture flowcharts and structured prompt templates.

4. Technical Architecture & Off-Grid Resilience
The platform must operate independently of local computing constraints, power instability, and local hardware availability:

Frontend & Hosting: Next.js (App Router) hosted on Vercel serverless infrastructure.

Backend Runtime: Stateless Vercel Edge/Serverless functions handling parsing and transformation pipelines.

Intelligence Layer: Google GenAI / Gemini Flash serverless models via REST API endpoints.

Persistence & Auth: Supabase (PostgreSQL) for user auth, session logs, rate limiting, and credit balances.

Payments: Lemon Squeezy or Stripe Checkout utilizing webhook-based entitlement provisioning.

Zero-Downtime Rule: No background tasks, daemon workers, or cron jobs rely on local developer machines. Once pushed to production, Lixxon Deconstruct runs entirely in the cloud 24/7.

5. Monetization & Unit Economics
To establish early revenue and reach the initial $2,000 milestone, Lixxon Deconstruct adopts a frictionless self-serve model:

Plan Tier	Price	Quota / Deliverables	Fulfillment Method
Explorer (Free)	$0	2 Lifetime Deconstruction credits	Automatic on session creation
Single Export Pass	$19 one-off	5 High-resolution deconstructions + SDK export	Instant Stripe/Lemon Squeezy checkout
Builder Pro	$79 / month	100 deconstructions/month, OpenAPI sync, code history	Automated recurring subscription
Founder Lifetime	$99 one-off	Unlimited access (capped at first 50 early buyers)	Scarcity tier to accelerate initial cash flow
Revenue Target Pathway ($2,000 Milestone)
Option A: 20 Founder Lifetime Licenses at $99 = $1,980

Option B: 15 Builder Pro subscriptions ($79) + 45 Single Export Passes ($19) = $2,040

6. Clean-Room Legal & Security Guardrails
Lixxon Deconstruct operates strictly under established clean-room engineering principles:

Interoperability Standard: The tool's primary purpose is system integration, data migration, and API documentation for authorized users.

No DRM or License Tampering: The engine strictly refuses to process copy protection mechanisms, licensing checks, or digital rights management systems.

Data Sanitization by Default: All network log analyzers (.har parsers) must strip Authorization, Cookie, Set-Cookie, and common bearer token headers locally before sending payloads to cloud LLMs.

Clean-Room Code Synthesis: The engine uses target inputs to build high-level structural specifications, instructing the AI to author completely original code implementations rather than duplicating source text verbatim.

7. Success Criteria & Project Milestones
Milestone 1: Successful deployment of Next.js + Tailwind + Vercel serverless foundation.

Milestone 2: End-to-end execution of Module 1 (HAR to OpenAPI 3.0) and Module 2 (HTML/Bundle to Tailwind).

Milestone 3: Working paywall mechanism with local storage quota tracking and Supabase sync.

Milestone 4: Live payment processing triggering instant account balance updates.

Milestone 5: Public release and onboarding of first 50 users.


<ElicitationsGroup message="Next documentation files to complete for your /docs directory:">
  <Elicitation label="Generate complete content for docs/01_ARCHITECTURE.md" query="Write the complete, detailed content for docs/01_ARCHITECTURE.md covering file structure, tech stack, and API communication flows."/>
  <Elicitation label="Generate complete content for docs/05_AGENT_PROTOCOL.md" query="Write the strict rules and state-machine instructions for docs/05_AGENT_PROTOCOL.md to govern Google Antigravity during implementation."/>
</ElicitationsGroup>