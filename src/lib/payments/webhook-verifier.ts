import crypto from "node:crypto";
import type { PlanTier } from "@/types/database";

export interface NormalizedWebhookEvent {
  provider: "stripe" | "lemon_squeezy";
  eventType: string;
  externalOrderId: string;
  userId: string | null;
  customerEmail: string;
  tier: PlanTier;
  creditsToAdd: number;
  amountCents: number;
  currency: string;
  rawPayload: Record<string, unknown>;
}

/**
 * Performs timing-safe HMAC-SHA256 digest verification.
 */
export function verifyHmacDigest(
  payload: string,
  providedSignature: string,
  secret: string
): boolean {
  try {
    const computed = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    const computedBuffer = Buffer.from(computed, "utf8");
    const providedBuffer = Buffer.from(providedSignature, "utf8");

    if (computedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifies Lemon Squeezy webhook signature from `x-signature` header.
 */
export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  return verifyHmacDigest(rawBody, signatureHeader, secret);
}

/**
 * Verifies Stripe webhook signature from `stripe-signature` header.
 * Header format: `t=1612345678,v1=abcdef123...`
 */
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds: number = 300
): boolean {
  if (!signatureHeader || !secret) return false;

  const elements = signatureHeader.split(",");
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const element of elements) {
    const [key, value] = element.trim().split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const eventTimestamp = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);

  // Check tolerance to prevent replay attacks
  if (isNaN(eventTimestamp) || Math.abs(now - eventTimestamp) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;

  return signatures.some((sig) => verifyHmacDigest(signedPayload, sig, secret));
}

/**
 * Parses and maps product variant / price metadata to PlanTier and credit counts.
 */
export function resolveTierFromIdentifier(
  identifier?: string | null
): { tier: PlanTier; credits: number } {
  const normalized = (identifier || "").toLowerCase();

  if (normalized.includes("lifetime") || normalized.includes("founder")) {
    return { tier: "lifetime", credits: 999999 };
  }
  if (normalized.includes("pro") || normalized.includes("monthly") || normalized.includes("builder")) {
    return { tier: "pro_monthly", credits: 100 };
  }
  // Default to Single Export Pass
  return { tier: "single_pass", credits: 5 };
}

/**
 * Normalizes payment payloads from either Stripe or Lemon Squeezy into a canonical format.
 */
export function parseWebhookPayload(
  body: Record<string, unknown>,
  provider: "stripe" | "lemon_squeezy"
): NormalizedWebhookEvent | null {
  if (provider === "lemon_squeezy") {
    const meta = body.meta as Record<string, unknown> | undefined;
    const data = body.data as Record<string, unknown> | undefined;
    const attributes = data?.attributes as Record<string, unknown> | undefined;
    const customData = meta?.custom_data as Record<string, unknown> | undefined;

    const eventName = (meta?.event_name as string) || "order_created";
    const orderId = String(data?.id || `ls_${Date.now()}`);
    const email = (attributes?.user_email as string) || "customer@example.com";
    const userId = (customData?.user_id as string) || null;

    const variantName = (attributes?.first_order_item as Record<string, unknown>)?.variant_name as string;
    const productName = (attributes?.first_order_item as Record<string, unknown>)?.product_name as string;
    const { tier, credits } = resolveTierFromIdentifier(variantName || productName || (customData?.tier as string));

    const totalCents = typeof attributes?.total === "number" ? attributes.total : 0;
    const currency = (attributes?.currency as string) || "USD";

    return {
      provider: "lemon_squeezy",
      eventType: eventName,
      externalOrderId: orderId,
      userId,
      customerEmail: email,
      tier,
      creditsToAdd: credits,
      amountCents: totalCents,
      currency,
      rawPayload: body,
    };
  }

  if (provider === "stripe") {
    const eventType = (body.type as string) || "checkout.session.completed";
    const dataObj = (body.data as Record<string, unknown>)?.object as Record<string, unknown> | undefined;

    if (!dataObj) return null;

    const orderId = (dataObj.id as string) || `stripe_${Date.now()}`;
    const customerDetails = dataObj.customer_details as Record<string, unknown> | undefined;
    const email = (customerDetails?.email as string) || (dataObj.customer_email as string) || "customer@example.com";
    const metadata = dataObj.metadata as Record<string, unknown> | undefined;
    const userId = (dataObj.client_reference_id as string) || (metadata?.user_id as string) || null;

    const { tier, credits } = resolveTierFromIdentifier(
      (metadata?.tier as string) || (dataObj.line_items as string)
    );

    const amountTotal = typeof dataObj.amount_total === "number" ? dataObj.amount_total : 0;
    const currency = (dataObj.currency as string)?.toUpperCase() || "USD";

    return {
      provider: "stripe",
      eventType,
      externalOrderId: orderId,
      userId,
      customerEmail: email,
      tier,
      creditsToAdd: credits,
      amountCents: amountTotal,
      currency,
      rawPayload: body,
    };
  }

  return null;
}
