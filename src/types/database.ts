export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanTier = "free" | "single_pass" | "pro_monthly" | "lifetime";
export type ModuleType = "forge" | "cleanroom" | "logic" | "spy";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type Profile = {
  id: string;
  email: string;
  plan_tier: PlanTier;
  credits_remaining: number;
  total_jobs_run: number;
  stripe_customer_id: string | null;
  lemon_squeezy_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Job<TArtifact = Json> = {
  id: string;
  user_id: string;
  module_type: ModuleType;
  input_summary: string;
  input_tokens: number;
  output_tokens: number;
  status: JobStatus;
  output_artifact: TArtifact | null;
  error_message: string | null;
  execution_duration_ms: number | null;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string | null;
  provider: "stripe" | "lemon_squeezy";
  external_order_id: string;
  amount_cents: number;
  currency: string;
  tier_purchased: PlanTier;
  credits_added: number;
  raw_payload: Record<string, Json> | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, "created_at" | "id">;
        Update: Partial<Omit<Job, "created_at" | "id" | "user_id">>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "created_at" | "id">;
        Update: Partial<Omit<Order, "created_at" | "id">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_user_credits: {
        Args: { p_user_id: string; p_amount?: number };
        Returns: { success: boolean; credits_remaining: number; message: string }[];
      };
      fulfill_user_order: {
        Args: {
          p_user_id: string;
          p_provider: string;
          p_order_id: string;
          p_amount_cents: number;
          p_currency: string;
          p_tier: PlanTier;
          p_credits_to_add: number;
          p_raw_payload: Record<string, Json>;
        };
        Returns: boolean;
      };
    };
    Enums: {
      plan_tier: PlanTier;
      module_type: ModuleType;
      job_status: JobStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
