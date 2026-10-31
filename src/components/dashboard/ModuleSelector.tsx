"use client";

import React from "react";
import { Flame, Layout, Code2, Eye } from "lucide-react";
import type { ModuleType } from "@/types/database";

export interface ModuleConfig {
  id: ModuleType;
  name: string;
  badge: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  acceptedFiles: string;
  placeholderText: string;
  sampleInput: string;
}

export const MODULE_REGISTRY: Record<ModuleType, ModuleConfig> = {
  forge: {
    id: "forge",
    name: "Lixxon Forge",
    badge: "OpenAPI 3.0 & SDK",
    tagline: "Extract clean schemas and typed client libraries from raw HTTP traffic or .har captures",
    icon: Flame,
    acceptedFiles: ".har,.json,.txt",
    placeholderText: `Paste raw HTTP request/response text, cURL command, or browser .har log...\n\nExample:\nPOST /api/v2/invoices/9821 HTTP/1.1\nHost: internal.crm.company.com\nAuthorization: Bearer secret_live_token\nContent-Type: application/json\n\n{"customer_id": 1420, "amount": 850.00}`,
    sampleInput: `POST /api/v2/orders/checkout HTTP/1.1
Host: api.storefront.internal
Authorization: Bearer token_live_839182391283
Cookie: session_id=sess_prod_99214; tracking_id=tr_99182
Content-Type: application/json
Accept: application/json

{
  "cart_id": "cart_9912",
  "items": [
    {"sku": "SKU-A81", "quantity": 2, "unit_price": 49.99},
    {"sku": "SKU-B12", "quantity": 1, "unit_price": 19.50}
  ],
  "shipping_tier": "express",
  "currency": "USD"
}

HTTP/1.1 200 OK
Content-Type: application/json

{
  "order_id": "ord_5521",
  "status": "confirmed",
  "total_charged": 119.48,
  "estimated_delivery": "2026-11-04T12:00:00Z"
}`,
  },
  cleanroom: {
    id: "cleanroom",
    name: "Lixxon CleanRoom",
    badge: "Tailwind + TSX",
    tagline: "Decompile minified DOM trees and messy CSS into clean, responsive React components",
    icon: Layout,
    acceptedFiles: ".html,.htm,.txt",
    placeholderText: `Paste minified HTML markup, extracted DOM nodes, or component source...\n\nExample:\n<div class="css-19f8za _ngcontent-3" style="background:#111827;padding:24px;">\n  <h2 style="font-weight:700;color:#38bdf8;">User Analytics</h2>\n</div>`,
    sampleInput: `<div class="cx-panel-container-29x" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; max-width: 480px; font-family: sans-serif;">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10b981;"></span>
      <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">Production Cluster</h3>
    </div>
    <span style="color: #10b981; font-size: 12px; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 9999px;">Healthy</span>
  </div>
  <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">Cluster metrics indicate nominal resource consumption across all 8 nodes.</p>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div style="background: #18181b; padding: 12px; border-radius: 8px; border: 1px solid #27272a;">
      <div style="color: #71717a; font-size: 11px;">CPU Load</div>
      <div style="color: #fafafa; font-size: 18px; font-weight: 700; margin-top: 4px;">23.4%</div>
    </div>
    <div style="background: #18181b; padding: 12px; border-radius: 8px; border: 1px solid #27272a;">
      <div style="color: #71717a; font-size: 11px;">Memory</div>
      <div style="color: #fafafa; font-size: 18px; font-weight: 700; margin-top: 4px;">4.1 / 16 GB</div>
    </div>
  </div>
</div>`,
  },
  logic: {
    id: "logic",
    name: "Lixxon Logic",
    badge: "Clean TS / Python + Tests",
    tagline: "Decouple mathematical business models and algorithms into modern, unit-tested code",
    icon: Code2,
    acceptedFiles: ".js,.ts,.cs,.py,.txt",
    placeholderText: `Paste legacy algorithmic routines, validation rules, or decompiled formulas...\n\nExample:\nfunction calcFee(t, a, v) {\n  var r = 0;\n  if (t == 1) { r = a * 0.035; if (v) r -= 5; }\n  else if (t == 2) { r = a * 0.02; }\n  return Math.max(r, 0);\n}`,
    sampleInput: `// Legacy Insurance Risk Score Calculation Module (circa 2011)
function evaluateUnderwritingRisk(driverAge, priorViolations, creditScoreBand, vehicleCategory) {
  var riskIndex = 100;
  
  if (driverAge < 25) {
    riskIndex += (25 - driverAge) * 4.5;
  } else if (driverAge > 70) {
    riskIndex += (driverAge - 70) * 3.0;
  }
  
  switch(creditScoreBand) {
    case 'EXCELLENT': riskIndex -= 25; break;
    case 'GOOD': riskIndex -= 10; break;
    case 'FAIR': riskIndex += 15; break;
    case 'POOR': riskIndex += 45; break;
    default: riskIndex += 20; break;
  }
  
  if (priorViolations > 0) {
    riskIndex += Math.pow(priorViolations, 1.4) * 18;
  }
  
  if (vehicleCategory === 'SPORTS' || vehicleCategory === 'LUXURY') {
    riskIndex *= 1.35;
  }
  
  return Math.min(Math.max(Math.round(riskIndex), 10), 500);
}`,
  },
  spy: {
    id: "spy",
    name: "Lixxon Spy",
    badge: "Prompt & Model Blueprint",
    tagline: "Deconstruct model parameters, system instructions, and RAG architectures from network traces",
    icon: Eye,
    acceptedFiles: ".json,.txt,.har",
    placeholderText: `Paste intercepted AI API requests, streaming chunks, or agent telemetry logs...\n\nExample:\n{"model": "gpt-4o", "messages": [{"role": "system", "content": "You are a specialized support rep..."}, {"role": "user", "content": "Hello"}]}`,
    sampleInput: `POST /v1/chat/completions HTTP/1.1
Host: api.openai.com
Authorization: Bearer sk-proj-super-secret-production-key
Content-Type: application/json

{
  "model": "gpt-4o-2024-08-06",
  "temperature": 0.2,
  "top_p": 0.95,
  "max_tokens": 1500,
  "messages": [
    {
      "role": "system",
      "content": "You are Nexus Support AI representing Acme Cloud Corp. User Tier: Enterprise. Account ID: ACC-88912. Available Documentation: [DocID 918: VPC Peering Protocol, DocID 412: Subnet Routing]. Always verify account permissions before providing CIDR blocks. Tone must be technical and concise."
    },
    {
      "role": "user",
      "content": "How do I configure VPC peering with my AWS us-east-1 VPC?"
    }
  ]
}`,
  },
};

interface ModuleSelectorProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  disabled?: boolean;
}

export function ModuleSelector({
  activeModule,
  onSelectModule,
  disabled = false,
}: ModuleSelectorProps) {
  const modules = Object.values(MODULE_REGISTRY);

  return (
    <div className="w-full">
      {/* 4-Column Grid Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;

          return (
            <button
              key={mod.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectModule(mod.id)}
              className={`group relative flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 ${
                isActive
                  ? "bg-zinc-900/90 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                  : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/40 hover:border-zinc-700/80"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex w-full items-center justify-between gap-2 mb-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-900 text-zinc-400 group-hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800"
                  }`}
                >
                  {mod.badge}
                </span>
              </div>

              {/* Title & Description */}
              <span className={`text-sm font-semibold tracking-tight ${
                isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
              }`}>
                {mod.name}
              </span>
              <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {mod.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
