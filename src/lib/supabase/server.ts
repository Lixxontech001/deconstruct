import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates an authenticated Server-Side Supabase Client for Route Handlers and Server Components.
 * Reads and updates user session cookies across edge and server boundaries.
 */
export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside Next.js request context (e.g. testing or standalone scripts)
    cookieStore = null;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_anon_key";

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore?.set(name, value, options);
          });
        } catch {
          // `setAll` was called from a Server Component where cookie mutation is restricted.
          // Ignored if middleware refreshes the session.
        }
      },
    },
  });
}

/**
 * Creates an elevated Admin Supabase Client using the Service Role Key.
 * Bypasses Row-Level Security for webhook fulfillment, quota audits, and atomic administrative tasks.
 */
export function createAdminClient() {
  if (typeof globalThis.WebSocket === "undefined") {
    // Provide lightweight fallback for Node 20 runtime to prevent Realtime instantiation crash
    // @ts-expect-error no-op WebSocket fallback for stateless serverless environments
    globalThis.WebSocket = class DummyWebSocket {};
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder_service_role_key";

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
