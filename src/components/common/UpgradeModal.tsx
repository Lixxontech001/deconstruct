"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Zap,
  Sparkles,
  ShieldCheck,
  Flame,
  ArrowRight,
} from "lucide-react";
import { resetAnonRuns } from "@/lib/quota";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRecharge?: (newCredits: number) => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  onSuccessRecharge,
}: UpgradeModalProps) {
  // Scarcity counter for Founder Lifetime
  const [remainingLifetimeSpots] = useState(8);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCheckout = (tier: "single_pass" | "lifetime" | "pro_monthly") => {
    // Dynamic checkout links if configured in environment
    const stripeUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL;
    const lemonUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL;

    if (stripeUrl || lemonUrl) {
      const targetUrl = (stripeUrl || lemonUrl) + `?tier=${tier}`;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Default Sandbox / Immediate Provisioning for testing and developer preview
    let creditsToAdd = 5;
    if (tier === "lifetime") creditsToAdd = 999999;
    if (tier === "pro_monthly") creditsToAdd = 100;

    resetAnonRuns();
    if (onSuccessRecharge) {
      onSuccessRecharge(creditsToAdd);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl shadow-emerald-950/20 sm:p-8 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close upgrade modal"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3 shadow-inner">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Developer Tier Access</span>
          </div>
          <h2
            id="upgrade-modal-title"
            className="text-2xl font-bold tracking-tight text-white font-mono"
          >
            Unlock Full Reverse Intelligence
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400 max-w-md mx-auto">
            Zero rate-limits. Export production-grade TypeScript SDKs, React TSX, clean logic, and AI prompt blueprints.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="space-y-3">
          {/* 1. Single Export Pass ($19) */}
          <div className="group relative flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  Single Export Pass
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  Pay Once
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                5 high-resolution runs + full OpenAPI & SDK generation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-lg font-bold text-white">$19</span>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout("single_pass")}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Select
              </button>
            </div>
          </div>

          {/* 2. Founder Lifetime ($99) - Scarcity Highlight */}
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 border-emerald-500/80 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 transition-all">
            {/* Scarcity Banner Badge */}
            <div className="absolute -top-3 right-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-0.5 text-[10px] font-bold text-zinc-950 uppercase tracking-wider shadow-md">
              <Flame className="h-3 w-3 fill-current" />
              <span>Capped at 50 Early Builders ({remainingLifetimeSpots} Left)</span>
            </div>

            <div className="space-y-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Founder Lifetime
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                  Lifetime Deal
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Unlimited deconstructions forever. All current & future modules.
              </p>
            </div>

            <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-3">
              <div className="text-right">
                <span className="text-xl font-extrabold text-emerald-400">
                  $99
                </span>
                <span className="block text-[10px] text-emerald-500/80">
                  One-time payment
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout("lifetime")}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3.5 py-2 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Claim Access</span>
              </button>
            </div>
          </div>

          {/* 3. Builder Pro ($79/mo) */}
          <div className="group relative flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  Builder Pro
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  Monthly Subscription
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                100 deconstructions/mo + OpenAPI automated sync
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-lg font-bold text-white">$79</span>
                <span className="text-xs font-normal text-zinc-500">/mo</span>
              </div>
              <button
                type="button"
                onClick={() => handleCheckout("pro_monthly")}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Quick Sandbox / Instant Demo Unlock */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>30-Day Money-Back Guarantee • Clean-Room Certified</span>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout("single_pass")}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
          >
            <span>Instant Sandbox Refill (5 Runs)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
