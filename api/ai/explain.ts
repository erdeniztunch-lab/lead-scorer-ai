import { json, readJsonBody, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { loadAiRuntimeEnv } from "../_lib/env";
import { readBearerToken } from "../_lib/security";
import { verifySupabaseAccessToken } from "../_lib/supabaseAuth";
import { withApiHandler } from "../_lib/handler";

interface ExplainRequestBody {
  leadName?: string;
  company?: string;
  score?: number;
  tier?: "hot" | "warm" | "cold";
  reasons?: string[];
}

function validateBody(body: ExplainRequestBody | null): string | null {
  if (!body) {
    return "Request body is required.";
  }
  if (!body.leadName || !body.company || typeof body.score !== "number" || !body.tier) {
    return "leadName, company, score and tier are required.";
  }
  if (body.reasons && !Array.isArray(body.reasons)) {
    return "reasons must be an array of strings.";
  }
  if (body.leadName.length > 120 || body.company.length > 120) {
    return "leadName/company are too long.";
  }
  if (body.score < 0 || body.score > 100) {
    return "score must be between 0 and 100.";
  }
  if (body.reasons && body.reasons.some((reason) => typeof reason !== "string" || reason.length > 100)) {
    return "reasons contain invalid values.";
  }
  return null;
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationConfig: {
        maxOutputTokens: 220,
        temperature: 0.2,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`gemini_http_${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("gemini_empty_output");
  }
  return text;
}

const handler = withApiHandler(
  {
    allowedMethods: ["POST"],
    maxBodyBytes: 12 * 1024,
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const env = loadAiRuntimeEnv(res, context.requestId);
    if (!env) {
      return;
    }

    const accessToken = readBearerToken(req);
    const user = await verifySupabaseAccessToken(res, {
      supabaseUrl: env.supabaseUrl,
      supabaseAnonKey: env.supabaseAnonKey,
      accessToken,
      requestId: context.requestId,
    });
    if (!user) {
      return;
    }

    const body = readJsonBody<ExplainRequestBody>(req);
    const validationError = validateBody(body);
    if (validationError) {
      withErrorMeta(res, 400, "invalid_request", validationError, { requestId: context.requestId });
      return;
    }

    const reasons = (body.reasons ?? []).slice(0, 3).join(", ") || "No explicit reasons";
    const prompt = [
      "You are an AI sales assistant for lead prioritization.",
      "Return only one concise paragraph in English.",
      "Do not invent facts and do not include markdown.",
      `Lead: ${body.leadName}`,
      `Company: ${body.company}`,
      `Score: ${Math.round(body.score ?? 0)}`,
      `Tier: ${body.tier}`,
      `Reasons: ${reasons}`,
      "Write a practical explanation and a next best action.",
    ].join("\n");

    try {
      const explanation = await callGemini(env.geminiApiKey, env.geminiModel, prompt);
      json(res, 200, {
        explanation,
        provider: "gemini",
        model: env.geminiModel,
        userId: user.id,
        generatedAt: new Date().toISOString(),
        requestId: context.requestId,
      });
    } catch {
      withErrorMeta(res, 502, "gemini_upstream_error", "Gemini API request failed.", {
        requestId: context.requestId,
      });
    }
  },
);

export default handler;
