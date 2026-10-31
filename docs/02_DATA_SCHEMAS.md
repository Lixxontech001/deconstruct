# 02_DATA_SCHEMAS.md

## 1. Overview & Architecture

Lixxon Deconstruct relies on Supabase (PostgreSQL) as its serverless persistence and identity layer. The data model enforces:
* **Strict Row-Level Security (RLS):** Clients can only inspect and manage their own jobs and profiles.
* **Atomic Credit Accounting:** Deductions and balance additions occur via transactional PostgreSQL functions (`SECURITY DEFINER`) to prevent race conditions or balance tampering.
* **Zero Payload Leaks:** Raw input archives (e.g., `.har` files containing authorization tokens) are sanitized in memory and never persisted raw to the database. Only sanitized structural summaries and synthesized artifacts are stored.
* **Webhook Idempotency:** Payment events from Lemon Squeezy or Stripe log unique transaction identifiers to avoid duplicate credit allocations.

---

## 2. PostgreSQL Migration Script (`supabase/migrations/0001_init_schema.sql`)

Run this complete SQL script in the Supabase SQL Editor or apply it via the Supabase CLI:

```sql
-- =============================================================================
-- LIXXON DECONSTRUCT: CORE SCHEMA & SECURITY DEFINITION
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE public.plan_tier AS ENUM (
  'free',
  'single_pass',
  'pro_monthly',
  'lifetime'
);

CREATE TYPE public.module_type AS ENUM (
  'forge',
  'cleanroom',
  'logic',
  'spy'
);

CREATE TYPE public.job_status AS ENUM (
  'queued',
  'processing',
  'completed',
  'failed'
);

-- -----------------------------------------------------------------------------
-- TABLE: public.profiles
-- User identity, active subscription tier, and execution credits.
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan_tier public.plan_tier NOT NULL DEFAULT 'free',
  credits_remaining INTEGER NOT NULL DEFAULT 2 CHECK (credits_remaining >= 0),
  total_jobs_run INTEGER NOT NULL DEFAULT 0 CHECK (total_jobs_run >= 0),
  stripe_customer_id TEXT UNIQUE,
  lemon_squeezy_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_plan_tier ON public.profiles USING btree (plan_tier);

-- -----------------------------------------------------------------------------
-- TABLE: public.jobs
-- Record of deconstruction tasks, token metrics, and generated artifacts.
-- -----------------------------------------------------------------------------
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_type public.module_type NOT NULL,
  input_summary TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  status public.job_status NOT NULL DEFAULT 'queued',
  output_artifact JSONB,
  error_message TEXT,
  execution_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_jobs_user_id ON public.jobs USING btree (user_id);
CREATE INDEX idx_jobs_module_type ON public.jobs USING btree (module_type);
CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);
CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: public.orders
-- Transaction log for payments and entitlement provisioning.
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'lemon_squeezy')),
  external_order_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  tier_purchased public.plan_tier NOT NULL,
  credits_added INTEGER NOT NULL DEFAULT 0,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);
CREATE INDEX idx_orders_external_id ON public.orders USING btree (external_order_id);

-- -----------------------------------------------------------------------------
-- TRIGGERS & FUNCTIONS
-- -----------------------------------------------------------------------------

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatically provision a public.profile upon user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, email, plan_tier, credits_remaining, total_jobs_run) VALUES ( NEW.id, NEW.email, 'free', 2, -- 2 free lifetime runs 0 ); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Atomic credit deduction RPC (Called by Next.js Serverless Route)
CREATE OR REPLACE FUNCTION public.decrement_user_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
)
RETURNS TABLE (
  success BOOLEAN,
  credits_remaining INTEGER,
  message TEXT
) AS $$ DECLARE v_current_credits INTEGER; v_current_tier public.plan_tier; BEGIN SELECT p.credits_remaining, p.plan_tier INTO v_current_credits, v_current_tier FROM public.profiles p WHERE p.id = p_user_id FOR UPDATE;    IF NOT FOUND THEN RETURN QUERY SELECT false, 0, 'User profile not found.'; RETURN; END IF;    -- Lifetime license tier bypasses credit decrement checks IF v_current_tier = 'lifetime' THEN UPDATE public.profiles SET total_jobs_run = total_jobs_run + p_amount WHERE id = p_user_id;      RETURN QUERY SELECT true, 999999, 'Lifetime tier active. Unlimited credits.'; RETURN; END IF;    IF v_current_credits < p_amount THEN RETURN QUERY SELECT false, v_current_credits, 'Insufficient credits remaining.'; RETURN; END IF;    UPDATE public.profiles SET credits_remaining = credits_remaining - p_amount, total_jobs_run = total_jobs_run + p_amount WHERE id = p_user_id RETURNING profiles.credits_remaining INTO v_current_credits;    RETURN QUERY SELECT true, v_current_credits, 'Credit deducted successfully.'; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit addition & tier upgrade RPC (Called by payment webhook)
CREATE OR REPLACE FUNCTION public.fulfill_user_order(
  p_user_id UUID,
  p_provider TEXT,
  p_order_id TEXT,
  p_amount_cents INTEGER,
  p_currency TEXT,
  p_tier public.plan_tier,
  p_credits_to_add INTEGER,
  p_raw_payload JSONB
)
RETURNS BOOLEAN AS $$ BEGIN -- 1. Insert order for audit trail (dedupes on external_order_id) INSERT INTO public.orders ( user_id, provider, external_order_id, amount_cents, currency, tier_purchased, credits_added, raw_payload ) VALUES ( p_user_id, p_provider, p_order_id, p_amount_cents, p_currency, p_tier, p_credits_to_add, p_raw_payload );    -- 2. Upgrade user profile UPDATE public.profiles SET plan_tier = CASE WHEN p_tier = 'lifetime' THEN 'lifetime'::public.plan_tier WHEN p_tier = 'pro_monthly' THEN 'pro_monthly'::public.plan_tier ELSE plan_tier END, credits_remaining = CASE WHEN p_tier = 'lifetime' THEN 999999 ELSE credits_remaining + p_credits_to_add END WHERE id = p_user_id;    RETURN true; EXCEPTION WHEN unique_violation THEN -- Order already processed RETURN false; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Revoke default public grants
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.jobs FROM anon, authenticated;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;

-- Grants for authenticated users
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.jobs TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;

-- Policies for public.profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Note: Profile updates (credits, tiers) can only be performed by service_role RPCs.

-- Policies for public.jobs
CREATE POLICY "Users can view own jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policies for public.orders
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
3. TypeScript Type Definitions (src/types/database.ts)
TypeScript
export type PlanTier = 'free' | 'single_pass' | 'pro_monthly' | 'lifetime';
export type ModuleType = 'forge' | 'cleanroom' | 'logic' | 'spy';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Profile {
  id: string;
  email: string;
  plan_tier: PlanTier;
  credits_remaining: number;
  total_jobs_run: number;
  stripe_customer_id: string | null;
  lemon_squeezy_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job<TArtifact Record<string, unknown>> {
  id: string;
  user_id: string;
  module_type: ModuleType;
  input_summary: string;
  input_tokens: number;
  output_tokens: number;
  status: JobStatus;
  output_artifact: TArtifact | null;
  error_message: string | null;
  execution_duration_ms: number | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  provider: 'stripe' | 'lemon_squeezy';
  external_order_id: string;
  amount_cents: number;
  currency: string;
  tier_purchased: PlanTier;
  credits_added: number;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' 'updated_at' |>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'created_at' 'id' |>;
        Update: Partial<Omit<Job, 'created_at' 'id' 'user_id' |>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'created_at' 'id' |>;
        Update: Partial<Omit<Order, 'created_at' 'id' |>>;
      };
    };
    Functions: {
      decrement_user_credits: {
        Args: { p_user_id: string; p_amount?: number };
        Returns: { success: boolean; credits_remaining: number; message: string }[];
      };
      fulfill_user_order: {
        Args: {
          p_user_id: string;
          p_provider: string;
          p_order_id: string;
          p_amount_cents: number;
          p_currency: string;
          p_tier: PlanTier;
          p_credits_to_add: number;
          p_raw_payload: Record<string, unknown>;
        };
        Returns: boolean;
      };
    };
  };
}
4. API Request & Artifact Payload Contracts (src/types/deconstruct.ts)
TypeScript
import { ModuleType } from './database';

// -----------------------------------------------------------------------------
// MODULE 1: LIXXON FORGE (API EXTRACTION)
// -----------------------------------------------------------------------------
export interface ForgeRequest {
  rawHarOrPayload: string;
  targetLanguage: 'typescript' | 'python';
  generateSdk?: boolean;
}

export interface ForgeArtifact {
  openApiSpec: string; // Validated OpenAPI 3.0.0 JSON string
  sdkCode: string;     // Ready-to-use client SDK code
  endpointsDetected: number;
  authTypeDetected: 'bearer' | 'basic' | 'cookie_session' | 'custom_header' | 'none';
  sanitizedHeaders: string[];
}

// -----------------------------------------------------------------------------
// MODULE 2: LIXXON CLEANROOM (FRONTEND DECOMPILER)
// -----------------------------------------------------------------------------
export interface CleanRoomRequest {
  rawMarkup: string;
  targetFramework: 'react' | 'vue';
  componentName?: string;
}

export interface CleanRoomArtifact {
  componentCode: string; // Clean TSX / JSX with Tailwind CSS classes
  detectedTokens: {
    colorPalette: string[];
    layoutStrategy: 'grid' | 'flexbox' | 'stacked';
    typographyScale: string[];
  };
  dependencies: string[]; // e.g. ["lucide-react", "clsx", "tailwind-merge"]
}

// -----------------------------------------------------------------------------
// MODULE 3: LIXXON LOGIC (LEGACY-TO-CLOUD)
// -----------------------------------------------------------------------------
export interface LogicRequest {
  legacySnippet: string;
  sourceFormat: 'dotnet' | 'wasm' | 'legacy-js' | 'pseudo';
  targetLanguage: 'typescript' | 'python';
}

export interface LogicArtifact {
  modernizedCode: string;
  unitTests: string;
  detectedInvariants: string[];
  complexityReductionNotes: string;
}

// -----------------------------------------------------------------------------
// MODULE 4: LIXXON SPY (AI PIPELINE DECONSTRUCTOR)
// -----------------------------------------------------------------------------
export interface SpyRequest {
  networkTrace: string;
}

export interface SpyArtifact {
  detectedModel: string;
  systemInstructionTemplate: string;
  injectedContextVariables: string[];
  parameterSettings: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  executionGraph: {
    steps: {
      order: number;
      actor: 'user' | 'model' | 'system' | 'tool';
      description: string;
    }[];
  };
}

// -----------------------------------------------------------------------------
// UNIFIED API RESPONSE WRAPPER
// -----------------------------------------------------------------------------
export interface DeconstructResponse<TArtifact> {
  success: boolean;
  jobId: string;
  module: ModuleType;
  creditsRemaining: number;
  executionDurationMs: number;
  data?: TArtifact;
  error?: string;
}

<ElicitationsGroup message="Next documentation files to complete for your /docs directory:">
  <Elicitation label="Generate complete content for docs/03_ROADMAP_MILESTONES.md" query="Write the complete, actionable task tracker for docs/03_ROADMAP_MILESTONES.md with step-by-step checkboxes for Antigravity."/>
  <Elicitation label="Generate complete content for docs/04_PROMPTS_AND_REASONING.md" query="Write the complete production system prompts, zero-shot templates, and JSON schemas for docs/04_PROMPTS_AND_REASONING.md."/>
</ElicitationsGroup>
