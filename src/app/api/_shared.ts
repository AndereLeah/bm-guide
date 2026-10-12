import { z } from "zod";
import { TAG_IDS } from "@/lib/tags";
import type { TagId } from "@/lib/types";

export const tagList = z
  .array(z.string())
  .max(20)
  .transform((a) => a.filter((t): t is TagId => TAG_IDS.has(t as TagId)));
export const style = z.enum(["approachable", "in-depth", "playful", "family"]);
export const detail = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const mode = z.enum(["live", "demo"]).default("demo");

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
export const language = z.enum(["en", "zh", "es", "fr"]).default("en");
