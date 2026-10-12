"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Empty, Notice, ObjectImage, SourceTag, Spinner } from "@/components/ui";
import { OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { recapDemo } from "@/lib/demo";
import { downloadText, summaryText } from "@/lib/export";
import { listJoin } from "@/lib/i18n";
import { postJson, useVisit } from "@/lib/store";
import { likedTags, type ResponseSource } from "@/lib/visit";

export default function SummaryPage() {
  const { state, hydrated, reset, t, lang } = useVisit();
  const router = useRouter();
  const [recap, setRecap] = useState<{ text: string; source: ResponseSource; notice?: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const seen = useMemo(() => state.completed.map((c) => OBJECTS_BY_ID[c.objectId]).filter(Boolean), [state.completed]);
  const liked = likedTags(state);
  const demoText = recapDemo(seen, liked, state.usedMinutes, lang);
  const key = `${state.completed.map((c) => c.objectId).join(",")}|${state.aiMode}|${liked.join(",")}|${lang}`;

  useEffect(() => {
    if (!hydrated || !state.prefs) return;
    let cancelled = false;
    if (state.aiMode !== "live" || !seen.length) {
      setRecap({ text: demoText, source: "demo" });
      return;
    }
    setRecap(null);
    postJson<{ recap: string; source: ResponseSource; notice?: string }>("/api/recap", {
      seen: seen.map((o) => o.id),
      liked,
      minutes: state.usedMinutes,
      style: state.prefs.style,
      demoText,
      mode: "live",
      language: lang,
    })
      .then((r) => !cancelled && setRecap({ text: r.recap, source: r.source, notice: r.notice }))
      .catch(() => !cancelled && setRecap({ text: demoText, source: "fallback" }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key]);

  if (!hydrated) return <Spinner label={t("common.loading")} />;
  if (!state.prefs) {
    return (
      <Empty title={t("s.emptyTitle")}>
        <Link href="/plan" className="btn-primary mt-3">
          {t("s.planVisit")}
        </Link>
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold leading-tight">{t("s.h1")}</h1>
      <p className="mt-1 text-sm text-muted">{t("s.meta", { date: state.prefs.visitStart.slice(0, 10), n: seen.length, min: state.usedMinutes })}</p>

      <section className="card mt-4 p-4" aria-labelledby="recap-h" aria-live="polite">
        <h2 id="recap-h" className="text-lg font-semibold">
          {t("s.recap")}
        </h2>
        {recap ? (
          <>
            <p className="mt-1 text-[16px] leading-relaxed">{recap.text}</p>
            <div className="mt-2">
              <SourceTag source={recap.source} notice={recap.notice} />
            </div>
          </>
        ) : (
          <Spinner label={t("s.writing")} />
        )}
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => downloadText(`bm-visit-summary-${state.prefs!.visitStart.slice(0, 10)}.md`, summaryText(state, recap?.text ?? demoText))}>
          {t("s.download")}
        </button>
        <Link href="/tour" className="btn-secondary">
          {t("s.back")}
        </Link>
        {!confirming ? (
          <button type="button" className="btn-secondary" onClick={() => setConfirming(true)}>
            {t("s.new")}
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm">{t("s.confirm")}</span>
            <button
              type="button"
              className="btn-primary bg-oxblood"
              onClick={() => {
                reset();
                router.push("/plan");
              }}
            >
              {t("s.yes")}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
              {t("s.cancel")}
            </button>
          </span>
        )}
      </div>

      <h2 className="mt-6 text-xl font-semibold">{t("s.explored")}</h2>
      {seen.length ? (
        <ol className="mt-3 space-y-3">
          {state.completed.map((c, i) => {
            const o = OBJECTS_BY_ID[c.objectId];
            const qs = (state.conversations[o.id] ?? []).filter((m) => m.role === "user").length;
            return (
              <li key={o.id}>
                <Link href={`/guide/${encodeURIComponent(o.id)}`} className="card flex gap-3 p-3 hover:shadow-md">
                  <ObjectImage o={o} className="h-20 w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {i + 1}. {o.title}
                    </p>
                    <p className="text-xs text-muted">
                      {o.date} · {ROOMS[c.roomId].shortName}
                      {qs ? ` · ${t("s.qs", { n: qs })}` : ""}
                    </p>
                    <p className="mt-1 text-sm">{o.summary}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-3">
          <Notice>{t("s.none")}</Notice>
        </div>
      )}
      {state.skipped.length > 0 && <p className="mt-4 text-sm text-muted">{t("s.skipped", { list: listJoin(lang, state.skipped.map((id) => OBJECTS_BY_ID[id].shortTitle)) })}</p>}
      {state.plan && state.plan.stops.length > 0 && (
        <p className="mt-2 text-sm text-muted">{t("s.still", { list: listJoin(lang, state.plan.stops.map((s) => OBJECTS_BY_ID[s.objectId].shortTitle)) })}</p>
      )}
    </div>
  );
}
