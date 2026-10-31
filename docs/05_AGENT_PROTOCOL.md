# 05_AGENT_PROTOCOL.md

## 1. Purpose & Authority

This document defines the strict operational rules of engagement, execution state machine, and behavioral boundaries for autonomous coding agents (Google Antigravity, Claude Code, Cursor, Codex) working within the `teardown-engine` repository.

All autonomous agents must treat this document as immutable and binding. Under no circumstances should an agent alter its execution loop, skip verification steps, modify files outside the current task's scope, or mark tasks as completed without passing the required verification checks.

---

## 2. Core Operational Invariants

Every agent operating on this codebase must adhere to five non-negotiable invariants:

1. **The Law of Single Focus:** You may only work on **exactly one unchecked task (`- [ ]`)** from `docs/03_ROADMAP_MILESTONES.md` per execution cycle. Never bundle two tasks together. Never jump to an unblocked future task.
2. **The Verification Gate:** Code that does not compile does not exist. You must run build and type verification commands prior to marking any checkbox as complete.
3. **The Zero-Drift Principle:** Do not reformat, refactor, or touch existing code unless explicitly required by the active task. Do not install unapproved packages or introduce alternative architectures (e.g., do not swap Supabase for Firebase or replace Next.js App Router with Pages Router).
4. **Clean-Room Enforcement:** Never generate bypasses for copy protection, licensing validation, or authentication walls. All reverse-engineering logic must focus strictly on interoperability, schema derivation, UI extraction, and legacy migration.
5. **No Speculative Deletions:** Never delete existing test files, documentation, or types unless explicitly directed.

---

## 3. The Autonomous State Machine

Each agent execution cycle must execute as a deterministic 6-step loop:

```text
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. INSPECT: Read docs/03_ROADMAP_MILESTONES.md              │
  │    Locate the first unchecked checkbox (- [ ]).             │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. CONTEXTUALIZE: Read specifications for this task in:     │
  │    - docs/01_ARCHITECTURE.md (System design & structure)     │
  │    - docs/02_DATA_SCHEMAS.md (Types & DB contracts)         │
  │    - docs/04_PROMPTS_AND_REASONING.md (Prompts & schemas)   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. EXECUTE: Author, modify, or configure targeted files.     │
  │    Confine changes strictly to the active task boundary.    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. VERIFY: Run typecheck and build validation commands.      │
  │    Fix any compiler or lint warnings immediately.           │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 5. MUTATE STATE: Update docs/03_ROADMAP_MILESTONES.md        │
  │    Change active task status from - [ ] to - [x].           │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 6. HANDOFF: Print Structured Task Completion Report.         │
  │    HALT and wait for explicit human authorization.          │
  └─────────────────────────────────────────────────────────────┘
4. Verification & Self-Correction Protocols
A. Mandatory Verification Commands
Before completing any task, execute the relevant command suite:

Bash
# Level 1: Type System & Contract Integrity
npx tsc --noEmit

# Level 2: Linter & Formatting
npm run lint

# Level 3: Production Build Compilation (Mandatory for milestone completion)
npm run build
B. Self-Correction Loop
If a verification command fails:

Analyze: Parse the compiler error message, filename, and line number.

Contain: Modify only the files directly responsible for the type mismatch or compilation error.

Retry Limit: You have three (3) automated attempts to resolve the issue.

Escalation: If the error persists after 3 attempts, do NOT check the task box. Roll back uncommitted changes, halt execution, and output a detailed diagnostic report explaining the blocker.

5. Architectural Coding Standards
To ensure zero cloud runtime degradation, you must strictly follow these coding conventions:

A. Next.js App Router & Serverless Boundary
No Client SDKs in Server Routes: Never import browser-only modules into /src/app/api/*.

No Secret Exposure: Never prefix server-only environment variables (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY) with NEXT_PUBLIC_.

Client Directives: Place 'use client' strictly at the top of interactive components (hooks, DOM event listeners). Keep server components as the default.

Statelessness: Serverless route handlers must not maintain global state in memory. All persistence must route through Supabase.

B. Google GenAI SDK Usage
Use official package imports: import { GoogleGenAI, Type } from '@google/genai';.

Always use structured JSON outputs with explicit schemas matching docs/04_PROMPTS_AND_REASONING.md.

Wrap all external AI calls in try/catch blocks that return standardized error JSON with appropriate HTTP status codes (400 for bad payloads, 402 for quota limits, 500 for runtime failures).

C. Database & Security Standards
Never execute direct client-side updates against user credit counts or subscription tiers. All balance mutations must use the decrement_user_credits or fulfill_user_order PostgreSQL RPCs.

Sanitize all raw payloads before sending to Gemini using src/lib/sanitizers/har-sanitizer.ts or src/lib/sanitizers/code-sanitizer.ts.

6. Standardized Handoff Report Format
At the conclusion of each execution cycle, the agent must output a report formatted exactly as follows:

Markdown
### [TASK COMPLETED]: Task X.X - <Task Title>

#### 1. Files Created & Modified
* `src/path/to/file1.ts` - Created serverless route handler for Module X.
* `src/path/to/file2.tsx` - Added UI view component.

#### 2. Verification Executed
* **TypeScript Check:** `npx tsc --noEmit` -> Passed (0 errors).
* **Build Check:** `npm run build` -> Passed (Clean build).

#### 3. State Mutation
* Updated `docs/03_ROADMAP_MILESTONES.md`: Marked `[Task X.X]` as complete (`[x]`).

#### 4. Next Task in Queue
* Ready to begin: **Task Y.Y - <Next Task Title>**.

*Awaiting developer confirmation to proceed with Task Y.Y.*