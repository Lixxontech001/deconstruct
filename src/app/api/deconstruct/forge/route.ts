import { NextRequest, NextResponse } from "next/server";
import { sanitizeHarPayload } from "@/lib/sanitizers/har-sanitizer";
import {
  generateDeconstruction,
  FORGE_SYSTEM_INSTRUCTION,
  ForgeResponseSchema,
} from "@/lib/ai/gemini-client";
import { enforceExecutionQuota } from "@/lib/quota-server";
import type { ForgeRequest, ForgeArtifact, DeconstructResponse } from "@/types/deconstruct";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const jobId = crypto.randomUUID();

  try {
    const body = (await req.json()) as Partial<ForgeRequest>;

    if (!body || typeof body.rawHarOrPayload !== "string" || !body.rawHarOrPayload.trim()) {
      return NextResponse.json<DeconstructResponse<ForgeArtifact>>(
        {
          success: false,
          jobId,
          module: "forge",
          creditsRemaining: 0,
          executionDurationMs: Date.now() - startTime,
          error: "Missing or invalid 'rawHarOrPayload' in request body.",
        },
        { status: 400 }
      );
    }

    const { rawHarOrPayload, targetLanguage = "typescript", generateSdk = true } = body;

    // 1. Quota Enforcement Gate (Checks authenticated credit balance or anonymous runs)
    const quota = await enforceExecutionQuota(
      req,
      (body as { anonRunsUsed?: number }).anonRunsUsed
    );

    if (!quota.authorized) {
      return NextResponse.json<DeconstructResponse<ForgeArtifact>>(
        {
          success: false,
          jobId,
          module: "forge",
          creditsRemaining: quota.creditsRemaining,
          executionDurationMs: Date.now() - startTime,
          error: quota.error || "Insufficient credits. Please upgrade your account.",
        },
        { status: quota.status }
      );
    }

    // 2. Sanitize payload (in-memory token & cookie stripping, static asset filtering)
    const sanitizedPayload = sanitizeHarPayload(rawHarOrPayload);

    // 3. Prepare structured inference prompt
    const prompt = `Target Language for Client SDK: ${targetLanguage}\nGenerate SDK: ${generateSdk}\n\nObserved Raw / HAR Network Traffic:\n${sanitizedPayload}`;

    // 4. Optional mock fallback for testing without live API keys
    let artifact: ForgeArtifact;
    if (process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
      artifact = {
        endpointsDetected: 1,
        authTypeDetected: "bearer",
        sanitizedHeaders: ["Authorization", "Content-Type"],
        openApiSpec: JSON.stringify({
          openapi: "3.0.0",
          info: { title: "Deconstructed API", version: "1.0.0" },
          paths: {
            "/api/v1/resource": {
              get: {
                summary: "Extracted Endpoint",
                responses: { "200": { description: "Successful response" } },
              },
            },
          },
        }),
        sdkCode:
          targetLanguage === "python"
            ? "class Client:\n    def get_resource(self):\n        pass"
            : "export class GeneratedClient {\n  async getResource() { return fetch('/api/v1/resource'); }\n}",
      };
    } else {
      artifact = await generateDeconstruction<ForgeArtifact>({
        systemInstruction: FORGE_SYSTEM_INSTRUCTION,
        prompt,
        schema: ForgeResponseSchema,
        temperature: 0.1,
        topP: 0.95,
      });
    }

    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<ForgeArtifact>>({
      success: true,
      jobId,
      module: "forge",
      creditsRemaining: quota.creditsRemaining,
      executionDurationMs,
      data: artifact,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal serverless execution failure.";
    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<ForgeArtifact>>(
      {
        success: false,
        jobId,
        module: "forge",
        creditsRemaining: 0,
        executionDurationMs,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
