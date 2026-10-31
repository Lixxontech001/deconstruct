"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Terminal,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from "lucide-react";

function AuthForm() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");
  const checkoutParam = searchParams.get("checkout");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(
    errorMessage ? "Authentication session could not be completed. Please try again." : null
  );

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback${checkoutParam ? `?checkout=${checkoutParam}` : ""}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send magic link.";
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    setAuthError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback${checkoutParam ? `?checkout=${checkoutParam}` : ""}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GitHub authentication failed.";
      setAuthError(msg);
      setIsGitHubLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 shadow-inner mb-3">
          <Terminal className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold font-mono tracking-tight text-white">
            LIXXON
          </span>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            DECONSTRUCT
          </span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Developer Sign-In
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Access your entitlement tiers, saved artifacts, and sync clean-room deconstructions.
        </p>
      </div>

      {/* Error Alert */}
      {authError && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      {/* Magic Link Sent Confirmation */}
      {magicLinkSent ? (
        <div className="flex flex-col items-center text-center p-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-white">
            Magic Link Dispatched
          </h2>
          <p className="text-xs text-zinc-300">
            We sent an authentication link to <span className="font-mono font-medium text-emerald-400">{email}</span>. Click the link to complete your login.
          </p>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="text-xs text-zinc-400 hover:text-white underline transition-colors pt-2"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* GitHub OAuth Button */}
          <button
            type="button"
            onClick={handleGitHubSignIn}
            disabled={isGitHubLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 py-2.5 px-4 text-xs font-semibold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isGitHubLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>Continue with GitHub</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-zinc-800" />
            <span className="absolute bg-zinc-950 px-2 text-[10px] uppercase font-mono text-zinc-500">
              or passwordless email
            </span>
          </div>

          {/* Email Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-zinc-300 mb-1">
                Developer Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 py-2.5 px-4 text-xs font-bold shadow-md shadow-emerald-500/10 hover:brightness-105 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Send Magic Link</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Back to Studio link */}
      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-center">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Return to Studio Console</span>
        </Link>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12 text-xs text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mr-2" />
            <span>Loading authentication console...</span>
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
