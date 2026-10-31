import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  verifyLemonSqueezySignature,
  verifyStripeSignature,
  parseWebhookPayload,
} from "@/lib/payments/webhook-verifier";
import type { Json } from "@/types/database";

export interface PaymentWebhookResponse {
  received: boolean;
  status: "fulfilled" | "duplicate_ignored" | "unhandled_event" | "error";
  orderId?: string;
  tier?: string;
  creditsAdded?: number;
  message?: string;
  error?: string;
}

/**
 * POST /api/webhooks/payment
 * Unified webhook receiver for Lemon Squeezy and Stripe checkout events.
 * Validates HMAC signatures, enforces idempotent fulfillment, and updates user entitlements.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown>;

    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json<PaymentWebhookResponse>(
        { received: false, status: "error", error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    const lsSignature = req.headers.get("x-signature");
    const stripeSignature = req.headers.get("stripe-signature");

    const lsSecret =
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET ||
      process.env.PAYMENT_WEBHOOK_SECRET ||
      "";
    const stripeSecret =
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.PAYMENT_WEBHOOK_SECRET ||
      "";

    let provider: "stripe" | "lemon_squeezy" | null = null;

    // Detect provider and validate HMAC signature
    if (lsSignature) {
      provider = "lemon_squeezy";
      if (lsSecret && !verifyLemonSqueezySignature(rawBody, lsSignature, lsSecret)) {
        return NextResponse.json<PaymentWebhookResponse>(
          { received: false, status: "error", error: "Invalid Lemon Squeezy webhook signature." },
          { status: 400 }
        );
      }
    } else if (stripeSignature) {
      provider = "stripe";
      if (stripeSecret && !verifyStripeSignature(rawBody, stripeSignature, stripeSecret)) {
        return NextResponse.json<PaymentWebhookResponse>(
          { received: false, status: "error", error: "Invalid Stripe webhook signature." },
          { status: 400 }
        );
      }
    } else {
      // If neither header is present, check fallback header or query provider for testing
      const queryProvider = req.nextUrl.searchParams.get("provider");
      if (queryProvider === "stripe" || queryProvider === "lemon_squeezy") {
        provider = queryProvider;
      } else if (body.meta && body.data) {
        provider = "lemon_squeezy";
      } else if (body.type && body.data) {
        provider = "stripe";
      } else {
        return NextResponse.json<PaymentWebhookResponse>(
          { received: false, status: "error", error: "Unrecognized payment provider headers." },
          { status: 400 }
        );
      }
    }

    // Parse and canonicalize webhook payload
    const event = parseWebhookPayload(body, provider);
    if (!event) {
      return NextResponse.json<PaymentWebhookResponse>(
        { received: true, status: "unhandled_event", message: "Event payload ignored." },
        { status: 200 }
      );
    }

    // Resolve or provision target user UUID
    const adminSupabase = createAdminClient();
    let targetUserId = event.userId;

    if (!targetUserId && event.customerEmail) {
      try {
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("email", event.customerEmail.toLowerCase())
          .maybeSingle();

        if (profile?.id) {
          targetUserId = profile.id;
        }
      } catch {
        // Continue if profile lookup fails
      }
    }

    // Fallback ID if unauthenticated guest checkout
    const resolvedUserId = targetUserId || "00000000-0000-0000-0000-000000000000";

    // Call Supabase atomic fulfillment RPC: public.fulfill_user_order
    try {
      const { data: fulfilled, error: rpcError } = await adminSupabase.rpc(
        "fulfill_user_order",
        {
          p_user_id: resolvedUserId,
          p_provider: event.provider,
          p_order_id: event.externalOrderId,
          p_amount_cents: event.amountCents,
          p_currency: event.currency,
          p_tier: event.tier,
          p_credits_to_add: event.creditsToAdd,
          p_raw_payload: event.rawPayload as Record<string, Json>,
        }
      );

      if (rpcError) {
        // If unique constraint violation occurred on external_order_id, it is a duplicate event
        if (rpcError.code === "23505" || rpcError.message.includes("unique")) {
          return NextResponse.json<PaymentWebhookResponse>({
            received: true,
            status: "duplicate_ignored",
            orderId: event.externalOrderId,
            message: "Order already processed. Duplicate webhook ignored.",
          });
        }
      }

      if (fulfilled === false) {
        return NextResponse.json<PaymentWebhookResponse>({
          received: true,
          status: "duplicate_ignored",
          orderId: event.externalOrderId,
          message: "Order already fulfilled previously.",
        });
      }

      return NextResponse.json<PaymentWebhookResponse>({
        received: true,
        status: "fulfilled",
        orderId: event.externalOrderId,
        tier: event.tier,
        creditsAdded: event.creditsToAdd,
        message: `Successfully provisioned ${event.tier} entitlements.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fulfillment RPC failed";
      // Return 200 so webhook provider does not infinitely retry unrecoverable schema errors
      return NextResponse.json<PaymentWebhookResponse>({
        received: true,
        status: "error",
        orderId: event.externalOrderId,
        error: msg,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal webhook processing error.";
    return NextResponse.json<PaymentWebhookResponse>(
      { received: false, status: "error", error: errorMsg },
      { status: 500 }
    );
  }
}
