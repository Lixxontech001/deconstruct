"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { ModuleSelector } from "@/components/dashboard/ModuleSelector";
import { ConsoleInput } from "@/components/dashboard/ConsoleInput";
import { CodeViewer } from "@/components/dashboard/CodeViewer";
import {
  getAnonRunsUsed,
  getAnonRunsRemaining,
  incrementAnonRuns,
  getClientQuotaState,
} from "@/lib/quota";
import type { ModuleType } from "@/types/database";
import type {
  ForgeArtifact,
  CleanRoomArtifact,
  LogicArtifact,
  SpyArtifact,
  DeconstructResponse,
} from "@/types/deconstruct";
import { CheckCircle, X } from "lucide-react";

export default function StudioDashboard() {
  const [activeModule, setActiveModule] = useState<ModuleType>("forge");
  const [inputPayload, setInputPayload] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<"typescript" | "python">("typescript");
  const [targetFramework, setTargetFramework] = useState<"react" | "vue">("react");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [executionDurationMs, setExecutionDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<
    ForgeArtifact | CleanRoomArtifact | LogicArtifact | SpyArtifact | null
  >(null);

  const [creditsRemaining, setCreditsRemaining] = useState<number>(() => {
    return getAnonRunsRemaining();
  });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        return "Payment confirmed! Your account entitlements have been activated and credits recharged.";
      }
    }
    return null;
  });

  // Sync session and clean URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Query live profile quota if authenticated
      getClientQuotaState().then((state) => {
        if (state.isAuthenticated) {
          setCreditsRemaining(state.creditsRemaining);
        }
      });
    }
  }, []);

  const handleModuleChange = (newModule: ModuleType) => {
    setActiveModule(newModule);
    setArtifact(null);
    setError(null);
    setExecutionDurationMs(null);
    setInputPayload("");
  };

  const handleExecute = async () => {
    if (!inputPayload.trim()) return;

    // Check credits before executing
    if (creditsRemaining <= 0) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setArtifact(null);

    const startTime = Date.now();

    try {
      let endpoint = "/api/deconstruct/forge";
      const anonRuns = getAnonRunsUsed();
      let requestBody: Record<string, unknown> = {
        anonRunsUsed: anonRuns,
      };

      switch (activeModule) {
        case "forge":
          endpoint = "/api/deconstruct/forge";
          requestBody = {
            ...requestBody,
            rawHarOrPayload: inputPayload,
            targetLanguage,
            generateSdk: true,
          };
          break;
        case "cleanroom":
          endpoint = "/api/deconstruct/cleanroom";
          requestBody = {
            ...requestBody,
            rawMarkup: inputPayload,
            targetFramework,
            componentName: "DeconstructedComponent",
          };
          break;
        case "logic":
          endpoint = "/api/deconstruct/logic";
          requestBody = {
            ...requestBody,
            legacySnippet: inputPayload,
            sourceFormat: "legacy-js",
            targetLanguage,
          };
          break;
        case "spy":
          endpoint = "/api/deconstruct/spy";
          requestBody = {
            ...requestBody,
            networkTrace: inputPayload,
          };
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anon-runs": String(anonRuns),
        },
        body: JSON.stringify(requestBody),
      });

      const json = (await res.json()) as DeconstructResponse<
        ForgeArtifact | CleanRoomArtifact | LogicArtifact | SpyArtifact
      >;

      if (res.status === 402) {
        setIsUpgradeModalOpen(true);
        throw new Error(json.error || "Execution limit reached. Please upgrade to continue.");
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Execution failed with HTTP status ${res.status}`);
      }

      setArtifact(json.data || null);
      setExecutionDurationMs(json.executionDurationMs || Date.now() - startTime);

      // Record incremented anonymous run and sync credit balance from server response
      const updatedRemaining = incrementAnonRuns();
      setCreditsRemaining(
        typeof json.creditsRemaining === "number" ? json.creditsRemaining : updatedRemaining
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown serverless execution error";
      setError(msg);
      setExecutionDurationMs(Date.now() - startTime);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-[#fafafa]">
      {/* Global Header */}
      <Header
        creditsRemaining={creditsRemaining}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      {/* Main Studio Dashboard Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
        {/* Post-Checkout Success Banner */}
        {checkoutNotice && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs text-emerald-200 shadow-lg shadow-emerald-950/20 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Order Fulfilled Successfully</span>
                <span>{checkoutNotice}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutNotice(null)}
              className="p-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-900/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Hero Title & Subheader */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest">
              Autonomous Reverse Engineering Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Lixxon Studio Console
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Transform undocumented network payloads, minified frontend bundles, legacy algorithms, and AI traces into clean, typed production code.
          </p>
        </div>

        {/* Module Segmented Controller */}
        <ModuleSelector
          activeModule={activeModule}
          onSelectModule={handleModuleChange}
          disabled={isLoading}
        />

        {/* 2-Column Split Workspace (Console Input vs Code Viewer) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Source Payload Input */}
          <ConsoleInput
            activeModule={activeModule}
            inputValue={inputPayload}
            onInputChange={setInputPayload}
            targetLanguage={targetLanguage}
            onTargetLanguageChange={setTargetLanguage}
            targetFramework={targetFramework}
            onTargetFrameworkChange={setTargetFramework}
            onSubmit={handleExecute}
            isLoading={isLoading}
          />

          {/* Right Column: Code Viewer & Artifact Exporter */}
          <CodeViewer
            activeModule={activeModule}
            data={artifact}
            isLoading={isLoading}
            executionDurationMs={executionDurationMs}
            error={error}
          />
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Modular Upgrade Modal with Scarcity Highlights & Sandbox Refill */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccessRecharge={(newCredits) => setCreditsRemaining(newCredits)}
      />
    </div>
  );
}
