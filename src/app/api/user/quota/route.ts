import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { deductUserCreditServer } from "@/lib/quota-server";

export interface QuotaApiResponse {
  success: boolean;
  authenticated: boolean;
  planTier: string;
  creditsRemaining: number;
  totalJobsRun: number;
  message?: string;
  error?: string;
}

/**
 * GET /api/user/quota
 * Returns the current authenticated or anonymous credit balance.
 */
export async function GET() {
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
        return NextResponse.json<QuotaApiResponse>({
          success: true,
          authenticated: true,
          planTier: profile.plan_tier,
          creditsRemaining: isUnlimited ? 999999 : profile.credits_remaining,
          totalJobsRun: profile.total_jobs_run,
        });
      }
    }
  } catch {
    // Unreachable Supabase or unauthenticated visitor fallback
  }

  // Anonymous default
  return NextResponse.json<QuotaApiResponse>({
    success: true,
    authenticated: false,
    planTier: "free",
    creditsRemaining: 2,
    totalJobsRun: 0,
  });
}

/**
 * POST /api/user/quota
 * Deducts execution credits atomically via PostgreSQL RPC `decrement_user_credits`.
 * Returns HTTP 402 Payment Required if credits < 1 and plan is not lifetime.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 1;
    const anonRunsUsed = typeof body.anonRunsUsed === "number" ? body.anonRunsUsed : 0;

    let user = null;
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error: authError } = await supabase.auth.getUser();
      if (!authError && data?.user) {
        user = data.user;
      }
    } catch {
      // Supabase unconfigured or offline - proceed with anonymous visitor check
    }

    if (user) {
      // Authenticated user deduction
      const deduction = await deductUserCreditServer(user.id, amount);

      if (!deduction.success) {
        return NextResponse.json<QuotaApiResponse>(
          {
            success: false,
            authenticated: true,
            planTier: "free",
            creditsRemaining: deduction.creditsRemaining,
            totalJobsRun: 0,
            error: deduction.message || "Insufficient credits remaining. Please upgrade.",
          },
          { status: 402 } // HTTP 402 Payment Required
        );
      }

      return NextResponse.json<QuotaApiResponse>({
        success: true,
        authenticated: true,
        planTier: deduction.creditsRemaining >= 900000 ? "lifetime" : "pro_monthly",
        creditsRemaining: deduction.creditsRemaining,
        totalJobsRun: 0,
        message: deduction.message,
      });
    }

    // Anonymous visitor check
    if (anonRunsUsed >= 2) {
      return NextResponse.json<QuotaApiResponse>(
        {
          success: false,
          authenticated: false,
          planTier: "free",
          creditsRemaining: 0,
          totalJobsRun: anonRunsUsed,
          error: "Free anonymous trial quota exhausted (2 runs limit reached). Please upgrade.",
        },
        { status: 402 }
      );
    }

    const remaining = Math.max(0, 2 - (anonRunsUsed + amount));
    return NextResponse.json<QuotaApiResponse>({
      success: true,
      authenticated: false,
      planTier: "free",
      creditsRemaining: remaining,
      totalJobsRun: anonRunsUsed + amount,
      message: "Anonymous credit deducted.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Quota processing failed";
    return NextResponse.json<QuotaApiResponse>(
      {
        success: false,
        authenticated: false,
        planTier: "free",
        creditsRemaining: 0,
        totalJobsRun: 0,
        error: message,
      },
      { status: 500 }
    );
  }
}
