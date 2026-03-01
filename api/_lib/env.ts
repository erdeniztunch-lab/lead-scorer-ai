import { type ApiResponse, withErrorMeta } from "./http";

export interface RuntimeEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
  geminiModel: string;
}

export function loadRuntimeEnv(res: ApiResponse, requestId?: string): RuntimeEnv | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";

  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    withErrorMeta(res, 500, "misconfigured_env", "Server environment variables are not configured.", {
      ...(requestId ? { requestId } : {}),
    });
    return null;
  }

  return { supabaseUrl, supabaseAnonKey, geminiApiKey, geminiModel };
}
