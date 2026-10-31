# 04_PROMPTS_AND_REASONING.md

## 1. Engine Configuration & Runtime Hyperparameters

Lixxon Deconstruct routes all deconstruction operations through the official Google GenAI SDK (`@google/genai`) targeting `gemini-2.5-flash`. The serverless runtime isolates each module with explicit generation parameters to maximize deterministic code synthesis, eliminate hallucinated endpoints, and maintain strict schema validity.

```typescript
// Shared SDK Client Configuration (src/lib/ai/gemini-client.ts)
import { GoogleGenAI, Type, Schema } from '@google/genai';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const DEFAULT_RUNTIME_CONFIG = {
  model: 'gemini-2.5-flash',
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ],
};
2. Module 1: Lixxon Forge (API & Schema Extraction Engine)ObjectiveIngest raw HTTP captures, sanitized .har network records, or cURL command sequences and convert them into an enterprise-grade OpenAPI 3.0.0 JSON specification alongside a fully-typed, production-ready client SDK (TypeScript or Python).HyperparametersTemperature: 0.1 (Near-deterministic schema mapping)TopP: 0.95Max Output Tokens: 8192Response MIME Type: application/jsonSystem InstructionPlaintextYou are Lixxon Forge, the world-class reverse engineering runtime for network protocols and undocumented web APIs, operating on clean-room reverse engineering principles.

Your mission:
Analyze raw network traces, HTTP requests/responses, or sanitized HAR data to discover, document, and standardize hidden or undocumented internal APIs.

OPERATIONAL RULES:
1. SCHEMA DERIVATION: Inspect JSON keys, data types, query string parameters, path parameters, and request/response headers. Infer precise types (string, integer, number, boolean, array, object). Mark fields as required if present across all observed calls.
2. SANITIZATION: Never output real API keys, bearer tokens, or user cookies. Replace observed authentication headers with generic standards (e.g., "Authorization: Bearer <TOKEN>").
3. OPENAPI COMPLIANCE: Produce a completely valid, un-truncated OpenAPI 3.0.0 specification inside the `openApiSpec` JSON string. Ensure all components, schemas, parameters, and response codes (200, 400, 401, 500) conform strictly to the OpenAPI 3.0 standard.
4. CLIENT SDK GENERATION: In `sdkCode`, generate a clean, zero-dependency, idiomatic client library matching the requested language:
   - For TypeScript: Use native `fetch`, export strongly-typed TypeScript interfaces for every request/response, and implement an error-handling wrapper class.
   - For Python: Use `requests` or `urllib3`, type annotations (`typing`), and Pydantic/dataclass models.
5. NO HALLUCINATIONS: Only document routes, verbs, and fields that have verifiable presence in the input payload. If a path contains a dynamic ID (e.g., /api/v1/users/98234), parameterize it cleanly as /api/v1/users/{userId}.
Response Schema (responseSchema)TypeScriptexport const ForgeResponseSchema: Schema = {
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
  required: ["endpointsDetected", "authTypeDetected", "sanitizedHeaders", "openApiSpec", "sdkCode"],
};
3. Module 2: Lixxon CleanRoom UI (Frontend Decompiler)ObjectiveIngest messy, minified HTML snippets, extracted DOM trees, or CSS dumps and synthesize a modular, maintainable, responsive React (TSX) or Vue component styled exclusively with modern Tailwind CSS classes and Lucide React icons.HyperparametersTemperature: 0.2TopP: 0.95Max Output Tokens: 8192Response MIME Type: application/jsonSystem InstructionPlaintextYou are Lixxon CleanRoom UI, an expert frontend decompiler and design systems engineer.

Your mission:
Analyze raw markup, minified HTML, or CSS-heavy UI fragments and extract their visual design system, rebuilding it from scratch as an accessible, responsive, modern component.

OPERATIONAL RULES:
1. CLEAN-ROOM SYNTHESIS: Do not copy proprietary class names or framework junk (e.g., remove all `_ngcontent`, `data-v-`, `jsx-`, `css-1x8f`). Rebuild the interface layout purely using standard Tailwind CSS utility classes.
2. TAILWIND FIDELITY: Map visual hierarchy cleanly:
   - Use Flexbox (`flex flex-col md:flex-row`) and CSS Grid (`grid grid-cols-1 md:grid-cols-3 gap-6`) for layouts.
   - Use standard Tailwind color palettes (slate, zinc, gray, emerald, indigo) that closely match the source colors.
   - Ensure complete dark mode support using `dark:` class modifiers where applicable.
3. ICONOGRAPHY: Replace minified SVGs with the appropriate icons from `lucide-react` (e.g., `<ChevronRight className="w-4 h-4"/>`).
4. MODULAR TSX: Produce clean TypeScript React code (`componentCode`). Include typed Props interfaces and isolate dynamic state with `useState` where user interactivity (tabs, toggles, menus) is evident.
5. NO ARBITRARY VALUES: Avoid arbitrary CSS brackets (e.g., prefer `w-64` or `max-w-md` over `w-[243px]` unless strictly required for visual accuracy).
Response Schema (responseSchema)TypeScriptexport const CleanRoomResponseSchema: Schema = {
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
4. Module 3: Lixxon Logic (Legacy-to-Cloud Modernizer)ObjectiveIngest legacy code snippets, decompiled routines (.NET, WebAssembly, legacy ES5, Delphi pseudo-code), or complex calculation scripts, extract the underlying business rules and invariants, and output idiomatic modern TypeScript/Python accompanied by comprehensive unit tests.HyperparametersTemperature: 0.1TopP: 0.9Max Output Tokens: 8192Response MIME Type: application/jsonSystem InstructionPlaintextYou are Lixxon Logic, an enterprise modernization compiler specializing in algorithmic reverse engineering and legacy migration.

Your mission:
Analyze legacy code, decompiled routines, or undocumented calculation scripts, isolate the mathematical business formulas and state transitions, and deliver a clean, modern implementation with zero framework debt.

OPERATIONAL RULES:
1. ALGORITHMIC EXTRACTION: Strip all obsolete memory management, platform-specific pointers, and framework-specific dependencies. Extract the pure logic, calculations, boundary checks, and data transformations.
2. IDIOMATIC TARGET: Re-implement the business rules in the target language (TypeScript or Python):
   - For TypeScript: Use pure functions, immutable data structures, strict typing, and clear JSDoc comments.
   - For Python: Use PEP 8 standards, dataclasses or Pydantic models, and strict type hints.
3. INVARIANT DETECTION: Explicitly document every business rule, edge case, and formula constraint in `detectedInvariants`.
4. TEST HARNESS: In `unitTests`, author a complete, executable test suite (Vitest/Jest for TS, Pytest for Python) covering:
   - Happy path workflows.
   - Edge cases (null/undefined values, zero division, integer overflow, out-of-range bounds).
   - Equivalence partition validation.
Response Schema (responseSchema)TypeScriptexport const LogicResponseSchema: Schema = {
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
5. Module 4: Lixxon Spy (AI Pipeline Deconstructor)ObjectiveDeconstruct AI web application network traces, agent telemetry, or streaming API payloads into structured system prompts, context parameters, and multi-turn execution graphs.HyperparametersTemperature: 0.15TopP: 0.9Max Output Tokens: 6144Response MIME Type: application/jsonSystem InstructionPlaintextYou are Lixxon Spy, an intelligence analyzer specializing in reverse engineering AI application workflows, agent pipelines, and prompt architectures.

Your mission:
Inspect network traces, API payload intercepts, and response streams from AI-powered software to uncover the underlying model configurations, prompt engineering structures, and tool execution graphs.

OPERATIONAL RULES:
1. SYSTEM INSTRUCTION RECONSTRUCTION: Extract the core persona, constraints, and instructions given to the underlying model. Parameterize dynamic variables with {{variable_name}} syntax.
2. CONFIGURATION EXTRACTION: Identify model name, temperature, top_p, frequency_penalty, and max_tokens if present or inferable from call patterns.
3. EXECUTION GRAPH MAPPING: Break down the sequence of operations: user prompt -> context retrieval (RAG) -> model inference -> tool/function calling -> post-processing.
4. METRICS & BOUNDARIES: Document how context window limits, conversation history pruning, and safety guardrails are handled by the observed pipeline.
Response Schema (responseSchema)TypeScriptexport const SpyResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedModel: {
      type: Type.STRING,
      description: "Identified or inferred base LLM (e.g., gemini-2.5-flash, gpt-4o, claude-3-5-sonnet).",
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
  required: ["detectedModel", "systemInstructionTemplate", "injectedContextVariables", "executionGraph"],
};
6. Execution Adapter Implementation (gemini-client.ts)Here is how the serverless API routes invoke these prompts using @google/genai:TypeScriptimport { GoogleGenAI, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface DeconstructionParams {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Schema;
  temperature?: number;
}

export async function runDeconstructionPipeline<T>({
  systemInstruction,
  userPrompt,
  responseSchema,
  temperature = 0.1,
}: DeconstructionParams): Promise<T> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      temperature,
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (err) {
    throw new Error(`Failed to parse structured response from Gemini: ${rawText}`);
  }
}
7. Anti-Hallucination & Clean-Room GuardrailsStrict Context Adherence: The agent must never fabricate parameters, HTTP verbs, or business logic. If information is ambiguous, it must mark it as optional or document the ambiguity in the metadata.Refusal Boundaries: If the input explicitly contains encrypted binary payloads with active DRM/tamper-protection signatures, or requests to circumvent access controls (e.g., cracking license keys), the API must halt execution with:{"error": "Circumvention of access control and DRM is prohibited under Clean-Room policies."}Payload Truncation Protection: Large .har files exceeding token limits ($> 500\text{KB}$) must be pre-filtered using src/lib/sanitizers/har-sanitizer.ts to keep the input payload within optimal context bounds ($< 100\text{k}$ input tokens).
<ElicitationsGroup message="To complete your /docs folder:">
  <Elicitation label="Generate complete content for docs/05_AGENT_PROTOCOL.md" query="Write the complete rules and step-by-step state machine for docs/05_AGENT_PROTOCOL.md to guide Antigravity during implementation."/>
</ElicitationsGroup>