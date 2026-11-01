import Link from "next/link";
import { Terminal, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 shadow-inner mb-4">
        <Terminal className="h-6 w-6 text-emerald-400" />
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400 mb-2">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>404 // Target Not Found</span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono sm:text-4xl mb-2">
        Endpoint Or Route Missing
      </h1>
      <p className="max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
        The requested resource, documentation artifact, or route target does not exist or has been relocated by the deconstruction pipeline.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Studio Console</span>
      </Link>
    </div>
  );
}
