"use client";

import { useEffect, useRef, useState } from "react";
import { postJson, useVisit } from "@/lib/store";
import type { ResponseSource } from "@/lib/visit";

/**
 * In live-AI mode, ask the server to phrase "why this stop" for the current plan, in the chosen language.
 * The planner's structured reason is always shown first and kept if the model fails.
 */
export function useAiReasons() {
  const { state, update, lang } = useVisit();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inflight = useRef<string>("");

  const stops = state.plan?.stops ?? [];
  const stale = stops.filter((s) => {
    const r = state.reasons[s.objectId];
    return !r || r.base !== s.reason || (r.lang ?? "en") !== lang;
  });
  const key = `${lang}|${stale.map((s) => `${s.objectId}:${s.reason}`).join("|")}`;

  useEffect(() => {
    if (state.aiMode !== "live" || !state.prefs || !stale.length || inflight.current === key) return;
    inflight.current = key;
    setLoading(true);
    setFailed(false);
    const prefs = state.prefs;
    // Many stops are phrased in several batches on the server, so allow extra time.
    postJson<{ reasons: Record<string, string>; liveIds?: string[]; source: ResponseSource }>("/api/reasons", {
      interests: [...prefs.interests, ...prefs.derivedTags],
      freeText: prefs.freeText,
      style: prefs.style,
      stops: stale.map((s) => ({ id: s.objectId, reason: s.reason })),
      mode: "live",
      language: lang,
    }, 90000)
      .then((r) => {
        if (r.source !== "live") setFailed(true);
        update((s) => {
          const reasons = { ...s.reasons };
          const live = new Set(r.liveIds ?? (r.source === "live" ? Object.keys(r.reasons) : []));
          for (const st of stale)
            if (live.has(st.objectId)) reasons[st.objectId] = { text: r.reasons[st.objectId], source: "live", base: st.reason, lang };
          return { ...s, reasons };
        });
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state.aiMode]);

  return { loading, failed };
}
