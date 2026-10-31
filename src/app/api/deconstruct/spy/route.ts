import { NextRequest, NextResponse } from "next/server";
import {
  generateDeconstruction,
  SPY_SYSTEM_INSTRUCTION,
  SpyResponseSchema,
} from "@/lib/ai/gemini-client";
import { enforceExecutionQuota } from "@/lib/quota-server";
import type { SpyRequest, SpyArtifact, DeconstructResponse } from "@/types/deconstruct";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const jobId = crypto.randomUUID();

  try {
    const body = (await req.json()) as Partial<SpyRequest>;

    if (!body || typeof body.networkTrace !== "string" || !body.networkTrace.trim()) {
      return NextResponse.json<DeconstructResponse<SpyArtifact>>(
        {
          success: false,
          jobId,
          module: "spy",
          creditsRemaining: 0,
          executionDurationMs: Date.now() - startTime,
          error: "Missing or invalid 'networkTrace' in request body.",
        },
        { status: 400 }
      );
    }

    const { networkTrace } = body;

    // 1. Quota Enforcement Gate (Checks authenticated credit balance or anonymous runs)
    const quota = await enforceExecutionQuota(
      req,
      (body as { anonRunsUsed?: number }).anonRunsUsed
    );

    if (!quota.authorized) {
      return NextResponse.json<DeconstructResponse<SpyArtifact>>(
        {
          success: false,
          jobId,
          module: "spy",
          creditsRemaining: quota.creditsRemaining,
          executionDurationMs: Date.now() - startTime,
          error: quota.error || "Insufficient credits. Please upgrade your account.",
        },
        { status: quota.status }
      );
    }

    // 2. Prepare structured inference prompt
    const prompt = `AI Network Trace / Telemetry / API Intercept:\n${networkTrace.trim()}`;

    // 3. Optional mock fallback for testing without live API keys
    let artifact: SpyArtifact;
    if (process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
      artifact = {
        detectedModel: "gemini-2.5-flash",
        systemInstructionTemplate:
          "You are an assistant for {{company_name}} helping users with {{topic}}. Tone: {{tone}}.",
        injectedContextVariables: ["company_name", "topic", "tone"],
        parameterSettings: {
          temperature: 0.2,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        executionGraph: {
          steps: [
            {
              order: 1,
              actor: "user",
              description: "User submits query with contextual search parameters.",
            },
            {
              order: 2,
              actor: "system",
              description: "Context engine injects user session and document embeddings into template.",
            },
            {
              order: 3,
              actor: "model",
              description: "Model performs inference under deterministic temperature settings.",
            },
          ],
        },
      };
    } else {
      artifact = await generateDeconstruction<SpyArtifact>({
        systemInstruction: SPY_SYSTEM_INSTRUCTION,
        prompt,
        schema: SpyResponseSchema,
        temperature: 0.15,
        topP: 0.9,
      });
    }

    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<SpyArtifact>>({
      success: true,
      jobId,
      module: "spy",
      creditsRemaining: quota.creditsRemaining,
      executionDurationMs,
      data: artifact,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal serverless execution failure.";
    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<SpyArtifact>>(
      {
        success: false,
        jobId,
        module: "spy",
        creditsRemaining: 0,
        executionDurationMs,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
