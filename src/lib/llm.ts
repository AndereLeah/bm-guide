import "server-only";
import type { z } from "zod";

/**
 * Minimal server-side LLM client. Keys are read from environment variables only and never sent
 * to the browser.
 *
 * Providers (first configured one wins):
 *  1. Stanford AI API Gateway — OpenAI-compatible Chat Completions at https://aiapi-prod.stanford.edu/v1,
 *     `Authorization: Bearer <key>` (KB00019978 "Stanford AI API Gateway Access and Usage").
 *  2. Anthropic Messages API.
 *  3. Any other OpenAI-compatible Chat Completions API.
 */

export type Provider = { kind: "stanford" | "anthropic" | "openai"; model: string; baseUrl: string; key: string };

export const STANFORD_BASE_URL = "https://aiapi-prod.stanford.edu/v1";
/** Default gateway model: a low-cost, fast, non-reasoning model. Must be one of the models on your key. */
export const STANFORD_DEFAULT_MODEL = "claude-haiku-4-5";

export function getProvider(): Provider | null {
  const forceDemo = process.env.DEMO_ONLY === "1" || process.env.DEMO_ONLY === "true";
  if (forceDemo) return null;
  if (process.env.STANFORD_AI_API_KEY) {
    return {
      kind: "stanford",
      key: process.env.STANFORD_AI_API_KEY,
      model: process.env.STANFORD_AI_MODEL || STANFORD_DEFAULT_MODEL,
      baseUrl: (process.env.STANFORD_AI_BASE_URL || STANFORD_BASE_URL).replace(/\/$/, ""),
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      kind: "anthropic",
      key: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      kind: "openai",
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    };
  }
  return null;
}

export class LLMError extends Error {}

/** Running token totals since the server started (no content is stored). */
export const usage = { calls: 0, failures: 0, inputTokens: 0, outputTokens: 0 };

/**
 * Optional app-side daily caps (in addition to the gateway's monthly budget):
 *   AI_DAILY_REQUEST_LIMIT  max model requests per day
 *   AI_DAILY_TOKEN_LIMIT    max input+output tokens per day
 * Counters live in server memory and reset at midnight UTC (or on restart). On serverless hosts each
 * instance counts separately, so treat these as a soft guard; the gateway budget is the hard limit.
 */
export const daily = { day: "", requests: 0, tokens: 0 };

function limitFromEnv(name: string): number | null {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function checkDailyLimit(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (daily.day !== today) Object.assign(daily, { day: today, requests: 0, tokens: 0 });
  const maxReq = limitFromEnv("AI_DAILY_REQUEST_LIMIT");
  const maxTok = limitFromEnv("AI_DAILY_TOKEN_LIMIT");
  if ((maxReq !== null && daily.requests >= maxReq) || (maxTok !== null && daily.tokens >= maxTok)) {
    throw new LLMError("Today's AI limit for this app has been reached");
  }
}

export function dailyLimits() {
  return { ...daily, requestLimit: limitFromEnv("AI_DAILY_REQUEST_LIMIT"), tokenLimit: limitFromEnv("AI_DAILY_TOKEN_LIMIT") };
}

/** OpenAI reasoning models (gpt-5*, o-series) take max_completion_tokens instead of max_tokens. */
function isReasoningModel(model: string) {
  return /^(gpt-5|gpt-6|o\d)/i.test(model);
}

function errorFor(status: number, body: string): LLMError {
  if (/max budget|budget_exceeded|budget/i.test(body)) return new LLMError("AI budget for this key is used up");
  if (/not allowed to access model|invalid model|model not found/i.test(body)) return new LLMError("This API key can't use the configured model");
  if (status === 401 || status === 403) return new LLMError("The AI API key was rejected");
  if (status === 429) return new LLMError("The AI service is rate-limiting requests");
  return new LLMError(`Model API returned ${status}`);
}

async function complete(p: Provider, system: string, user: string, maxTokens: number): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env.LLM_TIMEOUT_MS || (p.kind === "stanford" ? 30000 : 20000)));
  checkDailyLimit();
  usage.calls++;
  daily.requests++;
  const before = usage.inputTokens + usage.outputTokens;
  try {
    if (p.kind === "anthropic") {
      const res = await fetch(`${p.baseUrl}/v1/messages`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-api-key": p.key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: p.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw errorFor(res.status, await res.text().catch(() => ""));
      const data = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
      usage.inputTokens += data.usage?.input_tokens ?? 0;
      usage.outputTokens += data.usage?.output_tokens ?? 0;
      return (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
    }

    // OpenAI-compatible (Stanford gateway or OpenAI).
    const reasoning = isReasoningModel(p.model);
    const body: Record<string, unknown> = {
      model: p.model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };
    if (reasoning) {
      body.max_completion_tokens = maxTokens * 4; // reasoning tokens count against this limit
      body.reasoning_effort = "low";
    } else body.max_tokens = maxTokens;
    // JSON mode is reliably supported by OpenAI models; other providers behind the gateway are steered by the prompt.
    if (p.kind === "openai" || /^gpt/i.test(p.model)) body.response_format = { type: "json_object" };

    const res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${p.key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw errorFor(res.status, await res.text().catch(() => ""));
    const data = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    usage.inputTokens += data.usage?.prompt_tokens ?? 0;
    usage.outputTokens += data.usage?.completion_tokens ?? 0;
    return data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    usage.failures++;
    if (e instanceof LLMError) throw e;
    throw new LLMError((e as Error).name === "AbortError" ? "Model request timed out" : "Model request failed");
  } finally {
    clearTimeout(timer);
    daily.tokens += usage.inputTokens + usage.outputTokens - before;
  }
}

/** Extract the first JSON object from model text (tolerates ```json fences). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new LLMError("Model did not return JSON");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new LLMError("Model returned malformed JSON");
  }
}

export async function callJson<T>(system: string, user: string, schema: z.ZodType<T>, maxTokens = 700): Promise<T> {
  const p = getProvider();
  if (!p) throw new LLMError("No model configured");
  const text = await complete(p, system + "\n\nRespond with a single JSON object only, no prose outside it.", user, maxTokens);
  const parsed = schema.safeParse(extractJson(text));
  if (!parsed.success) throw new LLMError("Model output failed validation");
  return parsed.data;
}
