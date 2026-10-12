export const maxDuration = 60;

import { z } from "zod";
import { interpretInterests } from "@/lib/ai";
import { bad, mode, readJson, language } from "../_shared";

const Body = z.object({ text: z.string().max(1000), mode, language });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad("Invalid request");
  return Response.json(await interpretInterests(parsed.data.text, parsed.data.mode === "live", parsed.data.language));
}
