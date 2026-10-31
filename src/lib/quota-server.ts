import { createAdminClient, createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { ANON_MAX_RUNS, type UserQuotaState } from "@/lib/quota";
import type { PlanTier } from "@/types/database";

/**
 * Server-Side: Checks and returns quota status for the current HTTP request.
 */
export async function getServerQuotaState(): Promise<UserQuotaState> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan_tier, credits_remaining, total_jobs_run")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        const isUnlimited = profile.plan_tier === "lifetime";
        const isExhausted = !isUnlimited && profile.credits_remaining <= 0;

        return {
          isAuthenticated: true,
          userId: user.id,
          email: user.email,
          planTier: profile.plan_tier as PlanTier,
          creditsRemaining: isUnlimited ? 999999 : profile.credits_remaining,
          totalJobsRun: profile.total_jobs_run,
          isUnlimited,
          isExhausted,
        };
      }
    }
  } catch {
    // Fallback if server environment cannot reach Supabase
  }

  return {
    isAuthenticated: false,
    planTier: "free",
    creditsRemaining: ANON_MAX_RUNS,
    totalJobsRun: 0,
    isUnlimited: false,
    isExhausted: false,
  };
}

/**
 * Server-Side: Executes atomic credit deduction via PostgreSQL RPC `decrement_user_credits`.
 * If user has 'lifetime' tier, bypasses decrement check and increments total_jobs_run.
 */
export async function deductUserCreditServer(
  userId: string,
  amount: number = 1
): Promise<{ success: boolean; creditsRemaining: number; message: string }> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.rpc("decrement_user_credits", {
      p_user_id: userId,
      p_amount: amount,
    });

    if (error) {
      return {
        success: false,
        creditsRemaining: 0,
        message: error.message,
      };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        creditsRemaining: result.credits_remaining,
        message: result.message,
      };
    }

    return {
      success: false,
      creditsRemaining: 0,
      message: "No data returned from credit decrement RPC.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Credit deduction failure";
    return {
      success: false,
      creditsRemaining: 0,
      message: msg,
    };
  }
}

/**
 * Server-Side: Enforces execution quota before triggering expensive LLM pipelines.
 * Deducts 1 credit for authenticated users or asserts anonymous free tier (< 2 runs).
 * Returns { authorized: false, status: 402, ... } if quota is exhausted.
 */
export async function enforceExecutionQuota(
  req?: Request,
  providedAnonRuns?: number
): Promise<{
  authorized: boolean;
  creditsRemaining: number;
  userId?: string;
  error?: string;
  status: number;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Authenticated path
    if (!authError && user) {
      const deduction = await deductUserCreditServer(user.id, 1);

      if (!deduction.success) {
        return {
          authorized: false,
          creditsRemaining: deduction.creditsRemaining,
          userId: user.id,
          error: deduction.message || "Insufficient credits remaining. Please upgrade to continue.",
          status: 402, // HTTP 402 Payment Required
        };
      }

      return {
        authorized: true,
        creditsRemaining: deduction.creditsRemaining,
        userId: user.id,
        status: 200,
      };
    }
  } catch {
    // Supabase client error or unconfigured
  }

  // Anonymous visitor path
  let anonRuns = providedAnonRuns;
  if (anonRuns === undefined && req) {
    const headerVal = req.headers.get("x-anon-runs");
    if (headerVal) {
      const parsed = parseInt(headerVal, 10);
      if (!isNaN(parsed)) anonRuns = parsed;
    }
  }

  const effectiveAnonRuns = anonRuns ?? 0;
  if (effectiveAnonRuns >= ANON_MAX_RUNS) {
    return {
      authorized: false,
      creditsRemaining: 0,
      error: "Free anonymous trial quota exhausted (2 runs limit reached). Please upgrade.",
      status: 402,
    };
  }

  const remaining = Math.max(0, ANON_MAX_RUNS - (effectiveAnonRuns + 1));
  return {
    authorized: true,
    creditsRemaining: remaining,
    status: 200,
  };
}
