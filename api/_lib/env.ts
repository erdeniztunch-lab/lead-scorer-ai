import { type ApiResponse } from "./http";
import { error } from "./http";

export interface RuntimeEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
  geminiModel: string;
}

export function loadRuntimeEnv(res: ApiResponse): RuntimeEnv | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";

  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    error(res, 500, "misconfigured_env", "Server environment variables are not configured.");
    return null;
  }

  return { supabaseUrl, supabaseAnonKey, geminiApiKey, geminiModel };
}
