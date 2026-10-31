import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PlanTier } from "@/types/database";

export const ANON_MAX_RUNS = 2;
export const ANON_STORAGE_KEY = "lixxon_anon_runs";

export interface UserQuotaState {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  planTier: PlanTier;
  creditsRemaining: number;
  totalJobsRun: number;
  isUnlimited: boolean;
  isExhausted: boolean;
}

/**
 * Client-Side: Safely reads the number of anonymous deconstruction runs completed.
 */
export function getAnonRunsUsed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(ANON_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  } catch {
    return 0;
  }
}

/**
 * Client-Side: Returns remaining free runs for anonymous visitors (0 to 2).
 */
export function getAnonRunsRemaining(): number {
  const used = getAnonRunsUsed();
  return Math.max(0, ANON_MAX_RUNS - used);
}

/**
 * Client-Side: Increments the anonymous run counter in local storage.
 * Returns the updated remaining count.
 */
export function incrementAnonRuns(): number {
  if (typeof window === "undefined") return 0;
  try {
    const currentUsed = getAnonRunsUsed();
    const newUsed = currentUsed + 1;
    localStorage.setItem(ANON_STORAGE_KEY, String(newUsed));
    return Math.max(0, ANON_MAX_RUNS - newUsed);
  } catch {
    return 0;
  }
}

/**
 * Client-Side: Resets anonymous run counter back to 0.
 */
export function resetAnonRuns(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANON_STORAGE_KEY, "0");
  } catch {
    // Ignore storage errors
  }
}

/**
 * Client-Side: Queries live authentication and quota status.
 * Seamlessly bridges anonymous browser localStorage and authenticated Supabase profiles.
 */
export async function getClientQuotaState(): Promise<UserQuotaState> {
  if (typeof window === "undefined") {
    return {
      isAuthenticated: false,
      planTier: "free",
      creditsRemaining: ANON_MAX_RUNS,
      totalJobsRun: 0,
      isUnlimited: false,
      isExhausted: false,
    };
  }

  try {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      // User is authenticated - query Supabase public.profiles
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
    // Fall back to anonymous storage bridge if Supabase is offline or unconfigured
  }

  // Anonymous visitor fallback
  const remaining = getAnonRunsRemaining();
  return {
    isAuthenticated: false,
    planTier: "free",
    creditsRemaining: remaining,
    totalJobsRun: getAnonRunsUsed(),
    isUnlimited: false,
    isExhausted: remaining <= 0,
  };
}
