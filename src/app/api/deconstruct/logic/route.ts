import { NextRequest, NextResponse } from "next/server";
import {
  generateDeconstruction,
  LOGIC_SYSTEM_INSTRUCTION,
  LogicResponseSchema,
} from "@/lib/ai/gemini-client";
import { enforceExecutionQuota } from "@/lib/quota-server";
import type { LogicRequest, LogicArtifact, DeconstructResponse } from "@/types/deconstruct";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const jobId = crypto.randomUUID();

  try {
    const body = (await req.json()) as Partial<LogicRequest>;

    if (!body || typeof body.legacySnippet !== "string" || !body.legacySnippet.trim()) {
      return NextResponse.json<DeconstructResponse<LogicArtifact>>(
        {
          success: false,
          jobId,
          module: "logic",
          creditsRemaining: 0,
          executionDurationMs: Date.now() - startTime,
          error: "Missing or invalid 'legacySnippet' in request body.",
        },
        { status: 400 }
      );
    }

    const {
      legacySnippet,
      sourceFormat = "legacy-js",
      targetLanguage = "typescript",
    } = body;

    // 1. Quota Enforcement Gate (Checks authenticated credit balance or anonymous runs)
    const quota = await enforceExecutionQuota(
      req,
      (body as { anonRunsUsed?: number }).anonRunsUsed
    );

    if (!quota.authorized) {
      return NextResponse.json<DeconstructResponse<LogicArtifact>>(
        {
          success: false,
          jobId,
          module: "logic",
          creditsRemaining: quota.creditsRemaining,
          executionDurationMs: Date.now() - startTime,
          error: quota.error || "Insufficient credits. Please upgrade your account.",
        },
        { status: quota.status }
      );
    }

    // 2. Prepare structured inference prompt
    const prompt = `Source Format: ${sourceFormat}\nTarget Language: ${targetLanguage}\n\nLegacy Code / Routine Snippet:\n${legacySnippet.trim()}`;

    // 3. Optional mock fallback for testing without live API keys
    let artifact: LogicArtifact;
    if (process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
      artifact = {
        modernizedCode:
          targetLanguage === "python"
            ? `def calculate_discount(price: float, tier: str) -> float:\n    """Calculates customer discount according to verified business tier rules."""\n    rates = {'bronze': 0.05, 'silver': 0.10, 'gold': 0.20}\n    rate = rates.get(tier.lower(), 0.0)\n    return round(price * (1 - rate), 2)`
            : `export function calculateDiscount(price: number, tier: 'bronze' | 'silver' | 'gold'): number {\n  const rates: Record<string, number> = { bronze: 0.05, silver: 0.10, gold: 0.20 };\n  const rate = rates[tier.toLowerCase()] ?? 0;\n  return Number((price * (1 - rate)).toFixed(2));\n}`,
        unitTests:
          targetLanguage === "python"
            ? `import pytest\nfrom module import calculate_discount\n\ndef test_calculate_discount():\n    assert calculate_discount(100.0, 'gold') == 80.0\n    assert calculate_discount(100.0, 'unknown') == 100.0`
            : `import { describe, it, expect } from 'vitest';\nimport { calculateDiscount } from './module';\n\ndescribe('calculateDiscount', () => {\n  it('applies gold tier discount correctly', () => {\n    expect(calculateDiscount(100, 'gold')).toBe(80);\n  });\n  it('handles standard fallback for invalid tiers', () => {\n    // @ts-expect-error testing invalid input\n    expect(calculateDiscount(100, 'invalid')).toBe(100);\n  });\n});`,
        detectedInvariants: [
          "Discounts are discrete percentages mapped strictly to customer tiers.",
          "Invalid or undefined tiers receive zero discount (fallback to full price).",
          "Calculations enforce 2 decimal places precision for currency formatting.",
        ],
        complexityReductionNotes:
          "Replaced deeply nested legacy switch/goto control flow with a direct dictionary lookup and pure functional signature.",
      };
    } else {
      artifact = await generateDeconstruction<LogicArtifact>({
        systemInstruction: LOGIC_SYSTEM_INSTRUCTION,
        prompt,
        schema: LogicResponseSchema,
        temperature: 0.1,
        topP: 0.9,
      });
    }

    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<LogicArtifact>>({
      success: true,
      jobId,
      module: "logic",
      creditsRemaining: quota.creditsRemaining,
      executionDurationMs,
      data: artifact,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal serverless execution failure.";
    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<LogicArtifact>>(
      {
        success: false,
        jobId,
        module: "logic",
        creditsRemaining: 0,
        executionDurationMs,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
