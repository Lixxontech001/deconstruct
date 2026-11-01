import { GoogleGenAI, Type, type Schema } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSy_placeholder_key",
});

export const DEFAULT_RUNTIME_CONFIG = {
  model: "gemini-3.8-flash",
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  ],
};

// =============================================================================
// SCHEMAS (docs/04_PROMPTS_AND_REASONING.md)
// =============================================================================

export const ForgeResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    endpointsDetected: {
      type: Type.INTEGER,
      description: "Total count of unique HTTP routes and verb combinations discovered.",
    },
    authTypeDetected: {
      type: Type.STRING,
      enum: ["bearer", "basic", "cookie_session", "custom_header", "none"],
      description: "Identified authentication mechanism.",
    },
    sanitizedHeaders: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of headers observed and scrubbed of sensitive values.",
    },
    openApiSpec: {
      type: Type.STRING,
      description: "Complete, valid OpenAPI 3.0.0 JSON string specification.",
    },
    sdkCode: {
      type: Type.STRING,
      description: "Complete, copy-paste ready TypeScript or Python client SDK code.",
    },
  },
  required: [
    "endpointsDetected",
    "authTypeDetected",
    "sanitizedHeaders",
    "openApiSpec",
    "sdkCode",
  ],
};

export const CleanRoomResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    componentCode: {
      type: Type.STRING,
      description: "Complete React TSX or Vue component code with Tailwind CSS utility classes.",
    },
    detectedTokens: {
      type: Type.OBJECT,
      properties: {
        colorPalette: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Dominant hex or tailwind colors extracted from source markup.",
        },
        layoutStrategy: {
          type: Type.STRING,
          enum: ["grid", "flexbox", "stacked"],
          description: "Primary responsive container layout paradigm.",
        },
        typographyScale: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Detected font sizes and weight hierarchy.",
        },
      },
      required: ["colorPalette", "layoutStrategy", "typographyScale"],
    },
    dependencies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "External npm dependencies required (e.g., lucide-react, clsx).",
    },
  },
  required: ["componentCode", "detectedTokens", "dependencies"],
};

export const LogicResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    modernizedCode: {
      type: Type.STRING,
      description: "Refactored, production-ready TypeScript or Python business logic functions.",
    },
    unitTests: {
      type: Type.STRING,
      description: "Comprehensive test suite verifying all extracted formulas and edge cases.",
    },
    detectedInvariants: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of explicit business constraints, formulas, and rules identified.",
    },
    complexityReductionNotes: {
      type: Type.STRING,
      description: "Summary of legacy technical debt removed and modernization choices made.",
    },
  },
  required: ["modernizedCode", "unitTests", "detectedInvariants", "complexityReductionNotes"],
};

export const SpyResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedModel: {
      type: Type.STRING,
      description: "Identified or inferred base LLM (e.g., gemini-3.8-flash, gpt-4o, claude-3-5-sonnet).",
    },
    systemInstructionTemplate: {
      type: Type.STRING,
      description: "Reconstructed system prompt with {{variable}} placeholders.",
    },
    injectedContextVariables: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Dynamic context fields injected at runtime (e.g., user_profile, search_results).",
    },
    parameterSettings: {
      type: Type.OBJECT,
      properties: {
        temperature: { type: Type.NUMBER },
        topP: { type: Type.NUMBER },
        maxOutputTokens: { type: Type.INTEGER },
      },
    },
    executionGraph: {
      type: Type.OBJECT,
      properties: {
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              order: { type: Type.INTEGER },
              actor: { type: Type.STRING, enum: ["user", "model", "system", "tool"] },
              description: { type: Type.STRING },
            },
            required: ["order", "actor", "description"],
          },
        },
      },
      required: ["steps"],
    },
  },
  required: [
    "detectedModel",
    "systemInstructionTemplate",
    "injectedContextVariables",
    "executionGraph",
  ],
};

// =============================================================================
// SYSTEM INSTRUCTIONS (docs/04_PROMPTS_AND_REASONING.md)
// =============================================================================

export const FORGE_SYSTEM_INSTRUCTION = `You are Lixxon Forge, the world-class reverse engineering runtime for network protocols and undocumented web APIs, operating on clean-room reverse engineering principles.

Your mission:
Analyze raw network traces, HTTP requests/responses, or sanitized HAR data to discover, document, and standardize hidden or undocumented internal APIs.

OPERATIONAL RULES:
1. SCHEMA DERIVATION: Inspect JSON keys, data types, query string parameters, path parameters, and request/response headers. Infer precise types (string, integer, number, boolean, array, object). Mark fields as required if present across all observed calls.
2. SANITIZATION: Never output real API keys, bearer tokens, or user cookies. Replace observed authentication headers with generic standards (e.g., "Authorization: Bearer <TOKEN>").
3. OPENAPI COMPLIANCE: Produce a completely valid, un-truncated OpenAPI 3.0.0 specification inside the \`openApiSpec\` JSON string. Ensure all components, schemas, parameters, and response codes (200, 400, 401, 500) conform strictly to the OpenAPI 3.0 standard.
4. CLIENT SDK GENERATION: In \`sdkCode\`, generate a clean, zero-dependency, idiomatic client library matching the requested language:
   - For TypeScript: Use native \`fetch\`, export strongly-typed TypeScript interfaces for every request/response, and implement an error-handling wrapper class.
   - For Python: Use \`requests\` or \`urllib3\`, type annotations (\`typing\`), and Pydantic/dataclass models.
5. NO HALLUCINATIONS: Only document routes, verbs, and fields that have verifiable presence in the input payload. If a path contains a dynamic ID (e.g., /api/v1/users/98234), parameterize it cleanly as /api/v1/users/{userId}.`;

export const CLEANROOM_SYSTEM_INSTRUCTION = `You are Lixxon CleanRoom UI, an expert frontend decompiler and design systems engineer.

Your mission:
Analyze raw markup, minified HTML, or CSS-heavy UI fragments and extract their visual design system, rebuilding it from scratch as an accessible, responsive, modern component.

OPERATIONAL RULES:
1. CLEAN-ROOM SYNTHESIS: Do not copy proprietary class names or framework junk (e.g., remove all \`_ngcontent\`, \`data-v-\`, \`jsx-\`, \`css-1x8f\`). Rebuild the interface layout purely using standard Tailwind CSS utility classes.
2. TAILWIND FIDELITY: Map visual hierarchy cleanly:
   - Use Flexbox (\`flex flex-col md:flex-row\`) and CSS Grid (\`grid grid-cols-1 md:grid-cols-3 gap-6\`) for layouts.
   - Use standard Tailwind color palettes (slate, zinc, gray, emerald, indigo) that closely match the source colors.
   - Ensure complete dark mode support using \`dark:\` class modifiers where applicable.
3. ICONOGRAPHY: Replace minified SVGs with the appropriate icons from \`lucide-react\` (e.g., \`<ChevronRight className="w-4 h-4"/>\`).
4. MODULAR TSX: Produce clean TypeScript React code (\`componentCode\`). Include typed Props interfaces and isolate dynamic state with \`useState\` where user interactivity (tabs, toggles, menus) is evident.
5. NO ARBITRARY VALUES: Avoid arbitrary CSS brackets (e.g., prefer \`w-64\` or \`max-w-md\` over \`w-[243px]\` unless strictly required for visual accuracy).`;

export const LOGIC_SYSTEM_INSTRUCTION = `You are Lixxon Logic, an enterprise modernization compiler specializing in algorithmic reverse engineering and legacy migration.

Your mission:
Analyze legacy code, decompiled routines, or undocumented calculation scripts, isolate the mathematical business formulas and state transitions, and deliver a clean, modern implementation with zero framework debt.

OPERATIONAL RULES:
1. ALGORITHMIC EXTRACTION: Strip all obsolete memory management, platform-specific pointers, and framework-specific dependencies. Extract the pure logic, calculations, boundary checks, and data transformations.
2. IDIOMATIC TARGET: Re-implement the business rules in the target language (TypeScript or Python):
   - For TypeScript: Use pure functions, immutable data structures, strict typing, and clear JSDoc comments.
   - For Python: Use PEP 8 standards, dataclasses or Pydantic models, and strict type hints.
3. INVARIANT DETECTION: Explicitly document every business rule, edge case, and formula constraint in \`detectedInvariants\`.
4. TEST HARNESS: In \`unitTests\`, author a complete, executable test suite (Vitest/Jest for TS, Pytest for Python) covering:
   - Happy path workflows.
   - Edge cases (null/undefined values, zero division, integer overflow, out-of-range bounds).
   - Equivalence partition validation.`;

export const SPY_SYSTEM_INSTRUCTION = `You are Lixxon Spy, an intelligence analyzer specializing in reverse engineering AI application workflows, agent pipelines, and prompt architectures.

Your mission:
Inspect network traces, API payload intercepts, and response streams from AI-powered software to uncover the underlying model configurations, prompt engineering structures, and tool execution graphs.

OPERATIONAL RULES:
1. SYSTEM INSTRUCTION RECONSTRUCTION: Extract the core persona, constraints, and instructions given to the underlying model. Parameterize dynamic variables with {{variable_name}} syntax.
2. CONFIGURATION EXTRACTION: Identify model name, temperature, top_p, frequency_penalty, and max_tokens if present or inferable from call patterns.
3. EXECUTION GRAPH MAPPING: Break down the sequence of operations: user prompt -> context retrieval (RAG) -> model inference -> tool/function calling -> post-processing.
4. METRICS & BOUNDARIES: Document how context window limits, conversation history pruning, and safety guardrails are handled by the observed pipeline.`;

// =============================================================================
// RUNTIME EXECUTION HELPERS
// =============================================================================

export interface DeconstructionParams {
  systemInstruction: string;
  prompt: string;
  schema?: Schema;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  model?: string;
}

/**
 * Executes a structured inference pipeline using Google GenAI SDK and returns parsed JSON.
 */
export async function generateDeconstruction<T>({
  systemInstruction,
  prompt,
  schema,
  temperature = 0.1,
  topP = 0.95,
  maxOutputTokens = 8192,
  model = "gemini-3.8-flash",
}: DeconstructionParams): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature,
      topP,
      maxOutputTokens,
      responseMimeType: "application/json",
      ...(schema ? { responseSchema: schema } : {}),
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse structured response from Gemini: ${err instanceof Error ? err.message : String(err)}. Raw text: ${rawText}`
    );
  }
}

/**
 * Alias helper matching docs/04_PROMPTS_AND_REASONING.md specification.
 */
export async function runDeconstructionPipeline<T>(params: {
  systemInstruction: string;
  userPrompt: string;
  responseSchema?: Schema;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  model?: string;
}): Promise<T> {
  return generateDeconstruction<T>({
    systemInstruction: params.systemInstruction,
    prompt: params.userPrompt,
    schema: params.responseSchema,
    temperature: params.temperature,
    topP: params.topP,
    maxOutputTokens: params.maxOutputTokens,
    model: params.model,
  });
}
