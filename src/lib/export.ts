import { OBJECTS_BY_ID } from "@/data/objects";
import { LOCATION_VERIFIED_ON, MAP_EDITION, ROOMS } from "@/data/rooms";
import { parseLocal, toHHMM } from "./availability";
import { TAG_LABEL } from "./tags";
import type { VisitState } from "./visit";

const DISCLAIMER =
  "Independent educational prototype. Not affiliated with, approved or endorsed by the British Museum. Times are estimates; check gallery signage and britishmuseum.org on the day.";

export function itineraryText(s: VisitState): string {
  if (!s.prefs || !s.plan) return "No itinerary yet.";
  const p = s.prefs;
  const { minutes: start } = parseLocal(p.visitStart);
  const clock0 = start + s.usedMinutes;
  const lines: string[] = [];
  lines.push("# British Museum visit plan", "");
  lines.push(`Visit start: ${p.visitStart.replace("T", " ")} · Time budget: ${p.minutes} min · Guide style: ${p.style}`);
  if (p.interests.length) lines.push(`Interests: ${p.interests.map((t) => TAG_LABEL[t]).join(", ")}`);
  if (p.freeText) lines.push(`Your note: ${p.freeText}`);
  lines.push("");
  if (s.completed.length) {
    lines.push("## Already seen");
    s.completed.forEach((c, i) => lines.push(`${i + 1}. ${OBJECTS_BY_ID[c.objectId]?.title} — ${ROOMS[c.roomId].shortName}`));
    lines.push("");
  }
  if (s.skipped.length) {
    lines.push(`Skipped (not planned again): ${s.skipped.map((id) => OBJECTS_BY_ID[id]?.shortTitle).join(", ")}`, "");
  }
  lines.push(s.completed.length ? "## Remaining stops" : "## Stops");
  s.plan.stops.forEach((st, i) => {
    const o = OBJECTS_BY_ID[st.objectId];
    const via = st.path.length > 2 ? ` (via ${st.path.slice(1, -1).map((r) => ROOMS[r].shortName).join(", ")})` : "";
    lines.push(
      `${i + 1}. ${o.title}`,
      `   ${ROOMS[st.roomId].name}${o.display.placement ? ` — ${o.display.placement}` : ""}`,
      `   ~${toHHMM(clock0 + st.arriveAt)} · walk ${st.travelMinutes} min${via} · view ${st.viewMinutes} min`,
      `   Why: ${s.reasons[st.objectId]?.base === st.reason ? s.reasons[st.objectId].text : st.reason}`,
      `   Record: https://www.britishmuseum.org/collection/object/${o.id}`,
    );
  });
  lines.push("");
  lines.push(
    `Estimated total: ${s.plan.totalMinutes} min (${s.plan.viewingMinutes} viewing + ${s.plan.travelMinutes} walking) of ${s.plan.budgetMinutes} min available.`,
  );
  if (s.plan.warnings.length) lines.push("", "Notes:", ...s.plan.warnings.map((w) => `- ${w}`));
  lines.push("", `Location data verified ${LOCATION_VERIFIED_ON} from the official ${MAP_EDITION}.`, DISCLAIMER, "");
  return lines.join("\n");
}

export function summaryText(s: VisitState, recap: string): string {
  const lines: string[] = ["# My British Museum visit", ""];
  if (s.prefs) lines.push(`Date: ${s.prefs.visitStart.slice(0, 10)} · About ${s.usedMinutes} min of planned time used`, "");
  lines.push(recap, "");
  lines.push("## Objects I explored");
  if (!s.completed.length) lines.push("(none completed)");
  s.completed.forEach((c, i) => {
    const o = OBJECTS_BY_ID[c.objectId];
    lines.push(`${i + 1}. ${o.title} (${o.date}; ${o.culture}) — ${ROOMS[c.roomId].shortName}`, `   ${o.summary}`, `   https://www.britishmuseum.org/collection/object/${o.id}`);
    const conv = s.conversations[c.objectId]?.filter((m) => m.role === "user") ?? [];
    if (conv.length) lines.push(`   Questions I asked: ${conv.map((m) => `“${m.text}”`).join("; ")}`);
  });
  if (s.skipped.length) lines.push("", `Skipped: ${s.skipped.map((id) => OBJECTS_BY_ID[id]?.shortTitle).join(", ")}`);
  const remaining = s.plan?.stops ?? [];
  if (remaining.length) lines.push("", `Still on my list: ${remaining.map((st) => OBJECTS_BY_ID[st.objectId].shortTitle).join(", ")}`);
  lines.push("", "Object descriptions are paraphrased for this prototype from British Museum Collection online records.", DISCLAIMER, "");
  return lines.join("\n");
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
