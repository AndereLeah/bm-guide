"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeText } from "@/components/ChangeText";
import { StopCard } from "@/components/StopCard";
import { Empty, Notice, Spinner } from "@/components/ui";
import { useAiReasons } from "@/components/useReasons";
import { parseLocal } from "@/lib/availability";
import { downloadText, itineraryText } from "@/lib/export";
import { listJoin, renderCode, styleLabel, tagLabel } from "@/lib/i18n";
import { OBJECTS_BY_ID } from "@/data/objects";
import { useVisit } from "@/lib/store";
import { regenerate, startTour } from "@/lib/visit";

export default function ItineraryPage() {
  const { state, hydrated, update, t, lang } = useVisit();
  const router = useRouter();
  const { loading, failed } = useAiReasons();

  if (!hydrated) return <Spinner label={t("common.loading")} />;
  if (!state.prefs || !state.plan) {
    return (
      <Empty title={t("it.emptyTitle")}>
        {t("it.emptyBody")}
        <div className="mt-4">
          <Link href="/plan" className="btn-primary">
            {t("it.setPrefs")}
          </Link>
        </div>
      </Empty>
    );
  }

  const { prefs, plan } = state;
  const clock0 = parseLocal(prefs.visitStart).minutes + state.usedMinutes;
  const over = plan.totalMinutes > plan.budgetMinutes;
  const lastChange = state.changes.find((c) => c.changed !== false);
  const done = state.completed.length;
  const themes = [...prefs.interests, ...prefs.derivedTags.filter((x) => !prefs.interests.includes(x))].map((x) => tagLabel(lang, x));
  const noteItems = [...prefs.derivedTags.map((x) => tagLabel(lang, x)), ...prefs.derivedObjectIds.map((id) => OBJECTS_BY_ID[id]?.shortTitle).filter(Boolean)] as string[];
  const notes = plan.notes ?? plan.warnings.map((w) => ({ k: "warn.partial", v: { text: w } }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold leading-tight">{t("it.h1")}</h1>
      <p className="mt-1 text-[15px] text-muted">
        {themes.join(" · ") || t("it.highlights")} · {t("it.styleSuffix", { style: styleLabel(lang, prefs.style) })}
      </p>

      <section aria-label="Duration" className="card mt-4 grid grid-cols-3 divide-x divide-line text-center">
        <div className="p-3">
          <div className={`text-2xl font-semibold ${over ? "text-oxblood" : ""}`}>{plan.totalMinutes}</div>
          <div className="text-xs text-muted">{t("it.total", { n: plan.budgetMinutes })}</div>
        </div>
        <div className="p-3">
          <div className="text-2xl font-semibold">{plan.viewingMinutes}</div>
          <div className="text-xs text-muted">{t("it.viewing")}</div>
        </div>
        <div className="p-3">
          <div className="text-2xl font-semibold">{plan.travelMinutes}</div>
          <div className="text-xs text-muted">{t("it.walking")}</div>
        </div>
      </section>

      <div className="mt-3 space-y-2">
        {noteItems.length > 0 && <Notice>{t("it.fromNote", { note: listJoin(lang, noteItems) })}</Notice>}
        {lastChange && (
          <Notice tone="change">
            <ChangeText note={lastChange} />
          </Notice>
        )}
        {notes.map((n) => (
          <Notice key={n.k + JSON.stringify(n.v ?? {})} tone="warn">
            {renderCode(lang, n)}
          </Notice>
        ))}
        {loading && <Spinner label={t("it.aiLoading")} />}
        {failed && <Notice tone="warn">{t("it.aiFail")}</Notice>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={!plan.stops.length}
          onClick={() => {
            update(startTour);
            router.push(plan.stops[0] ? `/guide/${encodeURIComponent(plan.stops[0].objectId)}` : "/tour");
          }}
        >
          {state.started ? t("it.continue") : t("it.start")}
        </button>
        <Link href="/plan" className="btn-secondary">
          {t("it.edit")}
        </Link>
        <button type="button" className="btn-secondary" onClick={() => update(regenerate)}>
          {t("it.regen")}
        </button>
        <button type="button" className="btn-secondary" onClick={() => downloadText(`bm-itinerary-${prefs.visitStart.slice(0, 10)}.md`, itineraryText(state))}>
          {t("it.download")}
        </button>
      </div>

      {done > 0 && <p className="mt-4 text-sm text-muted">{t("it.completedNote", { n: done })}</p>}

      {plan.stops.length ? (
        <ol className="mt-4 space-y-3" aria-label={t("it.stopsAria")}>
          {plan.stops.map((s, i) => (
            <StopCard key={s.objectId} stop={s} number={done + i + 1} clockStart={clock0} highlight={lastChange?.added.includes(s.objectId)} />
          ))}
        </ol>
      ) : (
        <Empty title={t("it.noFitTitle")}>{t("it.noFitBody")}</Empty>
      )}

      <p className="mt-5 text-xs text-muted">{t("it.footer", { time: prefs.visitStart.slice(11) })}</p>
    </div>
  );
}
