"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Code2,
  FileJson,
  TestTube2,
  Sparkles,
  Clock,
  Layers,
  Terminal,
} from "lucide-react";
import type { ModuleType } from "@/types/database";
import type {
  ForgeArtifact,
  CleanRoomArtifact,
  LogicArtifact,
  SpyArtifact,
} from "@/types/deconstruct";

interface CodeViewerProps {
  activeModule: ModuleType;
  data: ForgeArtifact | CleanRoomArtifact | LogicArtifact | SpyArtifact | null;
  isLoading: boolean;
  executionDurationMs?: number | null;
  error?: string | null;
}

export function CodeViewer({
  activeModule,
  data,
  isLoading,
  executionDurationMs,
  error,
}: CodeViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("primary");
  const [copied, setCopied] = useState(false);

  // Determine subtabs based on module and data
  const getSubTabs = () => {
    switch (activeModule) {
      case "forge":
        return [
          { id: "primary", label: "Client SDK", icon: Code2 },
          { id: "spec", label: "OpenAPI 3.0 Spec", icon: FileJson },
          { id: "meta", label: "Metadata & Auth", icon: Layers },
        ];
      case "cleanroom":
        return [
          { id: "primary", label: "React Component", icon: Code2 },
          { id: "tokens", label: "Design Tokens", icon: Sparkles },
          { id: "deps", label: "Dependencies", icon: Layers },
        ];
      case "logic":
        return [
          { id: "primary", label: "Modernized Code", icon: Code2 },
          { id: "tests", label: "Unit Tests", icon: TestTube2 },
          { id: "invariants", label: "Invariants & Notes", icon: Layers },
        ];
      case "spy":
        return [
          { id: "primary", label: "Prompt Template", icon: Terminal },
          { id: "graph", label: "Execution Graph", icon: Layers },
          { id: "config", label: "Model Config", icon: Sparkles },
        ];
    }
  };

  const subTabs = getSubTabs();

  // Extract display content according to active tab
  const getActiveContent = (): { text: string; language: string; filename: string } => {
    if (!data) return { text: "", language: "text", filename: "artifact.txt" };

    switch (activeModule) {
      case "forge": {
        const forge = data as ForgeArtifact;
        if (activeSubTab === "spec") {
          return {
            text: forge.openApiSpec,
            language: "json",
            filename: "openapi-spec.json",
          };
        }
        if (activeSubTab === "meta") {
          return {
            text: JSON.stringify(
              {
                endpointsDetected: forge.endpointsDetected,
                authTypeDetected: forge.authTypeDetected,
                sanitizedHeaders: forge.sanitizedHeaders,
              },
              null,
              2
            ),
            language: "json",
            filename: "metadata.json",
          };
        }
        return {
          text: forge.sdkCode,
          language: forge.sdkCode.includes("def ") ? "python" : "typescript",
          filename: forge.sdkCode.includes("def ") ? "client.py" : "client.ts",
        };
      }

      case "cleanroom": {
        const cleanroom = data as CleanRoomArtifact;
        if (activeSubTab === "tokens") {
          return {
            text: JSON.stringify(cleanroom.detectedTokens, null, 2),
            language: "json",
            filename: "tokens.json",
          };
        }
        if (activeSubTab === "deps") {
          return {
            text: JSON.stringify({ dependencies: cleanroom.dependencies }, null, 2),
            language: "json",
            filename: "dependencies.json",
          };
        }
        return {
          text: cleanroom.componentCode,
          language: "tsx",
          filename: "Component.tsx",
        };
      }

      case "logic": {
        const logic = data as LogicArtifact;
        if (activeSubTab === "tests") {
          return {
            text: logic.unitTests,
            language: logic.unitTests.includes("def ") ? "python" : "typescript",
            filename: logic.unitTests.includes("def ") ? "test_logic.py" : "logic.test.ts",
          };
        }
        if (activeSubTab === "invariants") {
          return {
            text: JSON.stringify(
              {
                detectedInvariants: logic.detectedInvariants,
                complexityReductionNotes: logic.complexityReductionNotes,
              },
              null,
              2
            ),
            language: "json",
            filename: "invariants.json",
          };
        }
        return {
          text: logic.modernizedCode,
          language: logic.modernizedCode.includes("def ") ? "python" : "typescript",
          filename: logic.modernizedCode.includes("def ") ? "logic.py" : "logic.ts",
        };
      }

      case "spy": {
        const spy = data as SpyArtifact;
        if (activeSubTab === "graph") {
          return {
            text: JSON.stringify(spy.executionGraph, null, 2),
            language: "json",
            filename: "execution-graph.json",
          };
        }
        if (activeSubTab === "config") {
          return {
            text: JSON.stringify(
              {
                detectedModel: spy.detectedModel,
                parameterSettings: spy.parameterSettings,
                injectedContextVariables: spy.injectedContextVariables,
              },
              null,
              2
            ),
            language: "json",
            filename: "model-config.json",
          };
        }
        return {
          text: spy.systemInstructionTemplate,
          language: "markdown",
          filename: "system-prompt.txt",
        };
      }
    }
  };

  const { text: contentText, filename } = getActiveContent();

  const handleCopy = () => {
    if (!contentText) return;
    navigator.clipboard.writeText(contentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!contentText) return;
    const blob = new Blob([contentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Header & Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
        {/* Subtabs Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isTabActive
                    ? "bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700/60"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools: Execution duration, Copy, Download */}
        <div className="flex items-center gap-2">
          {executionDurationMs != null && !isLoading && !error && (
            <div className="hidden sm:flex items-center gap-1 rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-400 border border-zinc-800">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>{(executionDurationMs / 1000).toFixed(2)}s</span>
            </div>
          )}

          {data && !isLoading && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors"
                title={`Download ${filename}`}
              >
                <Download className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Display */}
      <div className="relative flex-1 flex flex-col min-h-[360px] sm:min-h-[420px] bg-[#09090b]/90 overflow-auto">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 space-y-4 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
              <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/50 border-t-transparent animate-spin" />
              <Terminal className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold text-zinc-100">
                Synthesizing Clean-Room Artifact
              </span>
              <p className="text-xs text-zinc-400 max-w-sm">
                Sanitizing tokens, isolating design tokens and generating strongly-typed specifications via Gemini serverless runtime...
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-rose-400">
            <div className="h-12 w-12 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-center mb-3">
              <Terminal className="h-6 w-6 text-rose-400" />
            </div>
            <span className="text-sm font-semibold text-rose-300">Deconstruction Failed</span>
            <p className="text-xs text-rose-400/80 mt-1 max-w-md font-mono bg-rose-950/20 p-3 rounded-lg border border-rose-900/30">
              {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-600 mb-4 shadow-inner">
              <Code2 className="h-7 w-7 text-zinc-500" />
            </div>
            <span className="text-sm font-semibold text-zinc-300">
              Awaiting Source Input
            </span>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
              Drop a network capture (.har), minified markup, legacy algorithm, or AI trace on the left, then click <strong className="text-zinc-300">Execute Deconstruction</strong>.
            </p>
          </div>
        )}

        {/* Code Content */}
        {data && !isLoading && !error && (
          <pre className="flex-1 p-4 font-mono text-xs text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-500/30">
            <code>{contentText}</code>
          </pre>
        )}
      </div>

      {/* Bottom Status / Filename Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/80 bg-zinc-900/40 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{filename}</span>
        </div>
        {data && !isLoading && (
          <span className="text-emerald-400 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Artifact Validated
          </span>
        )}
      </div>
    </div>
  );
}
