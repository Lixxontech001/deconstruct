import React from "react";
import { ShieldCheck, Cpu, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950/70 py-8 mt-auto backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Compliance */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-zinc-300">Clean-Room Compliant</span>
            </div>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <p className="text-xs text-zinc-400">
              All tokens scrubbed in-memory prior to cloud LLM synthesis. Zero persistent raw payload retention.
            </p>
          </div>

          {/* Engine Status & System Info */}
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 border border-emerald-500/20">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>Edge Engine 100% Operational</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-zinc-400 font-mono">
              <Cpu className="h-3.5 w-3.5 text-zinc-400" />
              <span>gemini-3.8-flash</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-3">
          <p>© 2026 Lixxon Studio. Engineered for autonomous off-grid serverless deployment.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Security & Guardrails</span>
            <span>•</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Interoperability Policy</span>
            <span>•</span>
            <span className="font-mono text-zinc-400">v0.1.0-alpha</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
