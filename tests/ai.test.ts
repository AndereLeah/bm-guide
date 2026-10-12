import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OBJECTS_BY_ID } from "@/data/objects";
import { answerQuestion, explainObject, interpretInterests } from "@/lib/ai";
import { answerDemo, detectFeedback, explainDemo, interpretInterestsDemo } from "@/lib/demo";
import { POST as askRoute } from "@/app/api/ask/route";
import { POST as explainRoute } from "@/app/api/explain/route";
import { GET as statusRoute } from "@/app/api/status/route";

const rosetta = OBJECTS_BY_ID["Y_EA24"];
const cat = OBJECTS_BY_ID["Y_EA64391"];

describe("demo answers are context-specific and grounded", () => {
  it("answers the same question differently for different objects", () => {
    const a = answerDemo("How old is it?", rosetta);
    const b = answerDemo("How old is it?", cat);
    expect(a.answer).toContain("196 BC");
    expect(b.answer).toContain("Late Period");
    expect(a.answer).not.toEqual(b.answer);
  });

  it("answers material, findspot, size, location and acquisition from the record", () => {
    expect(answerDemo("What is it made of?", rosetta).answer).toMatch(/granodiorite/);
    expect(answerDemo("Where was it found?", rosetta).answer).toMatch(/Fort Saint Julien/);
    expect(answerDemo("How big is it?", rosetta).answer).toMatch(/112\.3 cm/);
    expect(answerDemo("Which room is it in?", rosetta).answer).toMatch(/Room 4.*Central Saloon East/);
    expect(answerDemo("How did it come to the museum?", rosetta).answer).toMatch(/Treaty of Alexandria/);
  });

  it("says when information is unavailable instead of inventing it", () => {
    const r = answerDemo("What was the sculptor's favourite food?", cat);
    expect(r.outOfScope).toBe(true);
    expect(r.answer).toMatch(/don't cover that|doesn't name a maker/);
    const r2 = answerDemo("Who made it?", cat);
    expect(r2.answer).toMatch(/doesn't name a maker/);
  });

  it("uses recent conversation: 'tell me more' gives a fact not yet used", () => {
    const first = answerDemo("Why is it important?", rosetta);
    const history = [
      { role: "user" as const, text: "Why is it important?" },
      { role: "guide" as const, text: first.answer, factIds: first.factIds },
    ];
    const more = answerDemo("tell me more", rosetta, history);
    expect(more.factIds.length).toBe(1);
    expect(first.factIds).not.toContain(more.factIds[0]);
  });

  it("detects feedback in free text and proposes actions", () => {
    expect(detectFeedback("shorter please", cat).map((a) => a.type)).toContain("less-detail");
    const war = detectFeedback("I'm bored of war and battles", cat);
    expect(war[0]).toMatchObject({ type: "less-tags", tags: ["conflict"] });
    expect(detectFeedback("I love this!", cat)[0].type).toBe("more-like");
  });

  it("explanations change with style and detail", () => {
    const brief = explainDemo(rosetta, "approachable", 1).text;
    const deep = explainDemo(rosetta, "approachable", 3).text;
    expect(deep.length).toBeGreaterThan(brief.length * 2);
    const playful = explainDemo(rosetta, "playful", 2).text;
    const family = explainDemo(rosetta, "family", 2).text;
    const scholarly = explainDemo(rosetta, "in-depth", 2).text;
    expect(playful).toMatch(/Quick challenge/);
    expect(family).toMatch(/Look closely!/);
    expect(scholarly).toMatch(/Museum number EA24/);
    expect(new Set([brief, playful, family, scholarly]).size).toBe(4);
  });

  it("interprets free-text interests into known tags and objects", () => {
    const r = interpretInterestsDemo("I love cats and ancient writing, and how giant statues were moved");
    expect(r.tags).toEqual(expect.arrayContaining(["animals", "writing", "colossal"]));
    expect(r.objectIds).toContain("Y_EA64391");
  });
});

describe("live AI path: validation and fallback", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  const modelReturns = (text: string, status = 200) => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status })) as typeof fetch;
  };

  it("uses valid model output and strips unknown ids", async () => {
    modelReturns(JSON.stringify({ tags: ["animals", "dragons"], objectIds: ["Y_EA64391", "FAKE_1", "G_1805-0703-15"], note: "Cats!" }));
    const r = await interpretInterests("cats", true);
    expect(r.source).toBe("live");
    expect(r.tags).toEqual(["animals"]);
    expect(r.objectIds).toEqual(["Y_EA64391"]); // fake id and not-on-display id removed
  });

  it("falls back to a labelled demo answer on malformed output", async () => {
    modelReturns("Sure! The Rosetta Stone is great.");
    const r = await answerQuestion("Y_EA24", "How old is it?", [], "approachable", 2, true);
    expect(r.source).toBe("fallback");
    expect(r.notice).toMatch(/did not return JSON/);
    expect(r.answer).toContain("196 BC");
  });

  it("falls back when output fails schema validation", async () => {
    modelReturns(JSON.stringify({ text: 42 }));
    const r = await explainObject("Y_EA24", "playful", 2, [], true);
    expect(r.source).toBe("fallback");
    expect(r.notice).toMatch(/failed validation/);
  });

  it("falls back on API errors", async () => {
    modelReturns("{}", 529);
    const r = await answerQuestion("Y_EA24", "What is it made of?", [], "approachable", 2, true);
    expect(r.source).toBe("fallback");
    expect(r.answer).toMatch(/granodiorite/);
  });

  it("filters fact ids the model invents", async () => {
    modelReturns(JSON.stringify({ answer: "It dates to 196 BC.", factIds: ["Y_EA24#1", "Y_EA24#99"], outOfScope: false, feedback: { type: "none" } }));
    const r = await answerQuestion("Y_EA24", "When?", [], "approachable", 2, true);
    expect(r.source).toBe("live");
    expect(r.factIds).toEqual(["Y_EA24#1"]);
  });

  it("sends the current object and recent conversation to the model, and never the key to the client", async () => {
    let sent = "";
    globalThis.fetch = vi.fn(async (_u: unknown, init?: RequestInit) => {
      sent = String(init?.body);
      return new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify({ answer: "Yes.", factIds: [], outOfScope: false }) }] }));
    }) as typeof fetch;
    await answerQuestion("Y_EA24", "And why?", [{ role: "user", text: "Who found it?" }, { role: "guide", text: "Napoleon's soldiers." }], "approachable", 2, true);
    expect(sent).toContain("Rosetta Stone");
    expect(sent).toContain("Napoleon's soldiers.");
    const status = await (await statusRoute()).json();
    expect(JSON.stringify(status)).not.toContain("test-key");
    expect(status.live).toBe(true);
  });
});

describe("API routes", () => {
  it("rejects invalid input and unknown objects", async () => {
    const bad = await askRoute(new Request("http://x/api/ask", { method: "POST", body: "not json" }));
    expect(bad.status).toBe(400);
    const unknown = await explainRoute(
      new Request("http://x/api/explain", { method: "POST", body: JSON.stringify({ objectId: "NOPE", style: "playful", detail: 2, mode: "demo" }) }),
    );
    expect(unknown.status).toBe(404);
  });

  it("demo mode works without credentials and labels its source", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const res = await askRoute(
      new Request("http://x/api/ask", {
        method: "POST",
        body: JSON.stringify({ objectId: "Y_EA64391", question: "What should I look for?", style: "family", detail: 1, mode: "live" }),
      }),
    );
    const j = await res.json();
    expect(j.source).toBe("demo");
    expect(j.answer).toMatch(/gold earrings/);
    expect((await (await statusRoute()).json()).live).toBe(false);
  });
});

describe("Stanford AI API Gateway provider", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    delete process.env.STANFORD_AI_API_KEY;
    delete process.env.STANFORD_AI_MODEL;
    globalThis.fetch = realFetch;
  });

  it("calls the gateway's OpenAI-compatible endpoint with a Bearer key and the configured model", async () => {
    process.env.STANFORD_AI_API_KEY = "sk-test-gw";
    process.env.ANTHROPIC_API_KEY = "should-not-be-used";
    let url = "";
    let init: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (u: unknown, i?: RequestInit) => {
      url = String(u);
      init = i;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ answer: "196 BC.", factIds: [], outOfScope: false }) } }],
          usage: { prompt_tokens: 1200, completion_tokens: 40 },
        }),
      );
    }) as typeof fetch;
    const r = await answerQuestion("Y_EA24", "When?", [], "approachable", 2, true);
    delete process.env.ANTHROPIC_API_KEY;
    expect(r.source).toBe("live");
    expect(url).toBe("https://aiapi-prod.stanford.edu/v1/chat/completions");
    expect((init!.headers as Record<string, string>).authorization).toBe("Bearer sk-test-gw");
    const body = JSON.parse(String(init!.body));
    expect(body.model).toBe("claude-haiku-4-5");
    expect(body.max_tokens).toBeGreaterThan(0);
    expect(body.response_format).toBeUndefined(); // JSON mode only for gpt models
    const status = await (await statusRoute()).json();
    expect(status.provider).toBe("stanford");
    expect(status.usage.inputTokens).toBeGreaterThanOrEqual(1200);
    expect(JSON.stringify(status)).not.toContain("sk-test-gw");
  });

  it("uses max_completion_tokens for reasoning models and explains budget errors", async () => {
    process.env.STANFORD_AI_API_KEY = "sk-test-gw";
    process.env.STANFORD_AI_MODEL = "gpt-5-mini";
    let body: Record<string, unknown> = {};
    globalThis.fetch = vi.fn(async (_u: unknown, i?: RequestInit) => {
      body = JSON.parse(String(i!.body));
      return new Response('{"error":{"message":"max budget error - litellm"}}', { status: 400 });
    }) as typeof fetch;
    const r = await answerQuestion("Y_EA24", "When?", [], "approachable", 2, true);
    expect(body.max_completion_tokens).toBeGreaterThan(0);
    expect(body.max_tokens).toBeUndefined();
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(r.source).toBe("fallback");
    expect(r.notice).toMatch(/budget/);
    expect(r.answer).toContain("196 BC");
  });
});

describe("app-side daily AI limit", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    delete process.env.STANFORD_AI_API_KEY;
    delete process.env.AI_DAILY_REQUEST_LIMIT;
    globalThis.fetch = realFetch;
  });

  it("stops calling the model after the daily request limit and falls back to demo", async () => {
    const { daily } = await import("@/lib/llm");
    Object.assign(daily, { day: "", requests: 0, tokens: 0 });
    process.env.STANFORD_AI_API_KEY = "sk-test-gw";
    process.env.AI_DAILY_REQUEST_LIMIT = "2";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"answer":"ok","factIds":[],"outOfScope":false}' } }] })));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    expect((await answerQuestion("Y_EA24", "When?", [], "approachable", 2, true)).source).toBe("live");
    expect((await answerQuestion("Y_EA24", "When?", [], "approachable", 2, true)).source).toBe("live");
    const third = await answerQuestion("Y_EA24", "When?", [], "approachable", 2, true);
    expect(third.source).toBe("fallback");
    expect(third.notice).toMatch(/limit/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
