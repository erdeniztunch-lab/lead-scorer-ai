import { type ApiResponse, withErrorMeta } from "./http";

export interface CoreRuntimeEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface AiRuntimeEnv extends CoreRuntimeEnv {
  geminiApiKey: string;
  geminiModel: string;
}

export function loadCoreRuntimeEnv(res: ApiResponse, requestId?: string): CoreRuntimeEnv | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    withErrorMeta(res, 500, "misconfigured_env", "Server environment variables are not configured.", {
      ...(requestId ? { requestId } : {}),
    });
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function loadAiRuntimeEnv(res: ApiResponse, requestId?: string): AiRuntimeEnv | null {
  const core = loadCoreRuntimeEnv(res, requestId);
  if (!core) {
    return null;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  if (!geminiApiKey) {
    withErrorMeta(res, 500, "misconfigured_env", "Gemini environment variables are not configured.", {
      ...(requestId ? { requestId } : {}),
    });
    return null;
  }

  return {
    ...core,
    geminiApiKey,
    geminiModel,
  };
}
