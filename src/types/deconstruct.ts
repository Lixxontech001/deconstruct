import { ModuleType } from "./database";

// -----------------------------------------------------------------------------
// MODULE 1: LIXXON FORGE (API EXTRACTION)
// -----------------------------------------------------------------------------
export interface ForgeRequest {
  rawHarOrPayload: string;
  targetLanguage: "typescript" | "python";
  generateSdk?: boolean;
}

export interface ForgeArtifact {
  openApiSpec: string; // Validated OpenAPI 3.0.0 JSON string
  sdkCode: string; // Ready-to-use client SDK code
  endpointsDetected: number;
  authTypeDetected: "bearer" | "basic" | "cookie_session" | "custom_header" | "none";
  sanitizedHeaders: string[];
}

// -----------------------------------------------------------------------------
// MODULE 2: LIXXON CLEANROOM (FRONTEND DECOMPILER)
// -----------------------------------------------------------------------------
export interface CleanRoomRequest {
  rawMarkup: string;
  targetFramework: "react" | "vue";
  componentName?: string;
}

export interface CleanRoomArtifact {
  componentCode: string; // Clean TSX / JSX with Tailwind CSS classes
  detectedTokens: {
    colorPalette: string[];
    layoutStrategy: "grid" | "flexbox" | "stacked";
    typographyScale: string[];
  };
  dependencies: string[]; // e.g. ["lucide-react", "clsx", "tailwind-merge"]
}

// -----------------------------------------------------------------------------
// MODULE 3: LIXXON LOGIC (LEGACY-TO-CLOUD)
// -----------------------------------------------------------------------------
export interface LogicRequest {
  legacySnippet: string;
  sourceFormat: "dotnet" | "wasm" | "legacy-js" | "pseudo";
  targetLanguage: "typescript" | "python";
}

export interface LogicArtifact {
  modernizedCode: string;
  unitTests: string;
  detectedInvariants: string[];
  complexityReductionNotes: string;
}

// -----------------------------------------------------------------------------
// MODULE 4: LIXXON SPY (AI PIPELINE DECONSTRUCTOR)
// -----------------------------------------------------------------------------
export interface SpyRequest {
  networkTrace: string;
}

export interface SpyArtifact {
  detectedModel: string;
  systemInstructionTemplate: string;
  injectedContextVariables: string[];
  parameterSettings: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  executionGraph: {
    steps: {
      order: number;
      actor: "user" | "model" | "system" | "tool";
      description: string;
    }[];
  };
}

// -----------------------------------------------------------------------------
// UNIFIED API RESPONSE WRAPPER
// -----------------------------------------------------------------------------
export interface DeconstructResponse<TArtifact = unknown> {
  success: boolean;
  jobId: string;
  module: ModuleType;
  creditsRemaining: number;
  executionDurationMs: number;
  data?: TArtifact;
  error?: string;
}
