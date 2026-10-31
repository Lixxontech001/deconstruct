import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 * Exchanges temporary OAuth or Magic Link code for a permanent Supabase session.
 * Preserves post-checkout redirect targets and parameters.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const checkout = requestUrl.searchParams.get("checkout");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Construct clean redirect target
        const redirectUrl = new URL(next === "/dashboard" ? "/" : next, requestUrl.origin);
        if (checkout) {
          redirectUrl.searchParams.set("checkout", checkout);
        }
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      // Supabase connection or exchange error
    }
  }

  // Return user to auth page with error message if exchange failed
  return NextResponse.redirect(
    new URL("/auth?error=auth_exchange_failed", requestUrl.origin)
  );
}
