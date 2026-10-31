"use client";

import React from "react";
import { Terminal, Zap, BookOpen, ExternalLink, Sparkles } from "lucide-react";

interface HeaderProps {
  creditsRemaining?: number;
  onUpgradeClick?: () => void;
}

export function Header({ creditsRemaining = 2, onUpgradeClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 shadow-inner">
            <Terminal className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                LIXXON
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 tracking-wider">
                DECONSTRUCT
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Developer Reverse Intelligence Engine
            </span>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Documentation Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors sm:flex px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
          >
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            <span>Clean-Room Docs</span>
            <ExternalLink className="h-3 w-3 text-zinc-500" />
          </a>

          {/* Credits Badge */}
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 shadow-sm">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-mono font-semibold text-zinc-100">
                {creditsRemaining}
              </span>
              <span className="text-zinc-400 hidden xs:inline">Runs Available</span>
            </div>
          </div>

          {/* Upgrade / Unlock Button */}
          <button
            type="button"
            onClick={onUpgradeClick}
            className="relative group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 hover:brightness-105 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Upgrade</span>
          </button>

          {/* Authentication Link */}
          <a
            href="/auth"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white px-2.5 py-1.5 text-xs text-zinc-300 transition-colors"
          >
            <span>Sign In</span>
          </a>
        </div>
      </div>
    </header>
  );
}
