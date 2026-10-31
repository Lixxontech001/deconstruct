import { NextRequest, NextResponse } from "next/server";
import { cleanInputMarkup } from "@/lib/sanitizers/code-sanitizer";
import {
  generateDeconstruction,
  CLEANROOM_SYSTEM_INSTRUCTION,
  CleanRoomResponseSchema,
} from "@/lib/ai/gemini-client";
import { enforceExecutionQuota } from "@/lib/quota-server";
import type { CleanRoomRequest, CleanRoomArtifact, DeconstructResponse } from "@/types/deconstruct";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const jobId = crypto.randomUUID();

  try {
    const body = (await req.json()) as Partial<CleanRoomRequest>;

    if (!body || typeof body.rawMarkup !== "string" || !body.rawMarkup.trim()) {
      return NextResponse.json<DeconstructResponse<CleanRoomArtifact>>(
        {
          success: false,
          jobId,
          module: "cleanroom",
          creditsRemaining: 0,
          executionDurationMs: Date.now() - startTime,
          error: "Missing or invalid 'rawMarkup' in request body.",
        },
        { status: 400 }
      );
    }

    const {
      rawMarkup,
      targetFramework = "react",
      componentName = "DeconstructedComponent",
    } = body;

    // 1. Quota Enforcement Gate (Checks authenticated credit balance or anonymous runs)
    const quota = await enforceExecutionQuota(
      req,
      (body as { anonRunsUsed?: number }).anonRunsUsed
    );

    if (!quota.authorized) {
      return NextResponse.json<DeconstructResponse<CleanRoomArtifact>>(
        {
          success: false,
          jobId,
          module: "cleanroom",
          creditsRemaining: quota.creditsRemaining,
          executionDurationMs: Date.now() - startTime,
          error: quota.error || "Insufficient credits. Please upgrade your account.",
        },
        { status: quota.status }
      );
    }

    // 2. Sanitize raw markup (strips <script>, inline event handlers, base64 blobs, SVG bloat)
    const cleanedMarkup = cleanInputMarkup(rawMarkup);

    // 3. Prepare structured inference prompt
    const prompt = `Target Framework: ${targetFramework}\nComponent Name: ${componentName}\n\nCleaned Markup/DOM Extract:\n${cleanedMarkup}`;

    // 4. Optional mock fallback for testing without live API keys
    let artifact: CleanRoomArtifact;
    if (process.env.MOCK_AI === "true" || process.env.NODE_ENV === "test") {
      artifact = {
        componentCode: `import React from 'react';\nimport { CheckCircle } from 'lucide-react';\n\ninterface ${componentName}Props {\n  title?: string;\n}\n\nexport default function ${componentName}({ title = 'Deconstructed Card' }: ${componentName}Props) {\n  return (\n    <div className="flex flex-col p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-lg">\n      <div className="flex items-center gap-3">\n        <CheckCircle className="w-5 h-5 text-emerald-400" />\n        <h2 className="text-lg font-semibold">{title}</h2>\n      </div>\n    </div>\n  );\n}`,
        detectedTokens: {
          colorPalette: ["#18181b", "#27272a", "#10b981", "#f4f4f5"],
          layoutStrategy: "flexbox",
          typographyScale: ["text-sm", "text-base", "text-lg"],
        },
        dependencies: ["lucide-react", "clsx", "tailwind-merge"],
      };
    } else {
      artifact = await generateDeconstruction<CleanRoomArtifact>({
        systemInstruction: CLEANROOM_SYSTEM_INSTRUCTION,
        prompt,
        schema: CleanRoomResponseSchema,
        temperature: 0.2,
        topP: 0.95,
      });
    }

    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<CleanRoomArtifact>>({
      success: true,
      jobId,
      module: "cleanroom",
      creditsRemaining: quota.creditsRemaining,
      executionDurationMs,
      data: artifact,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal serverless execution failure.";
    const executionDurationMs = Date.now() - startTime;

    return NextResponse.json<DeconstructResponse<CleanRoomArtifact>>(
      {
        success: false,
        jobId,
        module: "cleanroom",
        creditsRemaining: 0,
        executionDurationMs,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
