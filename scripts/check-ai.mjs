#!/usr/bin/env node
/**
 * Checks the Stanford AI API Gateway key without printing it:
 *   1) GET /v1/models  → lists the models your key can use
 *   2) one tiny chat completion with STANFORD_AI_MODEL → confirms access and shows token usage
 * Usage: npm run check:ai   (reads .env.local / .env if present)
 */
import fs from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"#\n]*)"?\s*$/.exec(line);
    if (m && !process.env[m[1]] && m[2]) process.env[m[1]] = m[2].trim();
  }
}

const key = process.env.STANFORD_AI_API_KEY;
const base = (process.env.STANFORD_AI_BASE_URL || "https://aiapi-prod.stanford.edu/v1").replace(/\/$/, "");
const model = process.env.STANFORD_AI_MODEL || "claude-haiku-4-5";
if (!key) {
  console.error("STANFORD_AI_API_KEY is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}
const headers = { authorization: `Bearer ${key}`, "content-type": "application/json" };

const models = await fetch(`${base}/models`, { headers });
const mtext = await models.text();
if (!models.ok) {
  console.error(`GET /models failed (${models.status}): ${mtext.slice(0, 300)}`);
  process.exit(1);
}
const ids = (JSON.parse(mtext).data ?? []).map((m) => m.id).sort();
console.log(`Models on this key (${ids.length}): ${ids.join(", ")}`);
if (!ids.includes(model)) console.warn(`⚠ STANFORD_AI_MODEL="${model}" is not in that list — pick one of the above.`);

const t0 = Date.now();
const chat = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model,
    stream: false,
    max_tokens: 30,
    messages: [{ role: "user", content: 'Reply with the JSON {"ok": true} and nothing else.' }],
  }),
});
const ctext = await chat.text();
if (!chat.ok) {
  console.error(`Chat test failed (${chat.status}): ${ctext.slice(0, 300)}`);
  process.exit(1);
}
const data = JSON.parse(ctext);
console.log(`Chat OK with ${model} in ${Date.now() - t0} ms: ${JSON.stringify(data.choices?.[0]?.message?.content)}`);
console.log(`Usage: ${JSON.stringify(data.usage ?? {})}`);
