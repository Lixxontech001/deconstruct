import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a browser-side Supabase client with typed database schema.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_anon_key";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
