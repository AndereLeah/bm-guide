"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChangeText } from "@/components/ChangeText";
import { GalleryMap } from "@/components/GalleryMap";
import { StopCard } from "@/components/StopCard";
import { Empty, Notice, Spinner } from "@/components/ui";
import { useAiReasons } from "@/components/useReasons";
import { OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { parseLocal, toHHMM } from "@/lib/availability";
import { renderCode } from "@/lib/i18n";
import { useVisit } from "@/lib/store";
import { setRemainingMinutes, unskip } from "@/lib/visit";

export default function TourPage() {
  const { state, hydrated, update, t, lang } = useVisit();
  const [timeInput, setTimeInput] = useState("");
  const [showLog, setShowLog] = useState(false);
  useAiReasons();

  useEffect(() => {
    if (hydrated) setTimeInput(String(state.remainingMinutes));
  }, [hydrated, state.remainingMinutes]);

  if (!hydrated) return <Spinner label={t("common.loading")} />;
  if (!state.prefs || !state.plan) {
    return (
      <Empty title={t("t.noTourTitle")}>
        {t("t.noTourBody")}
        <div className="mt-4">
          <Link href="/plan" className="btn-primary">
            {t("it.setPrefs")}
          </Link>
        </div>
      </Empty>
    );
  }

  const { plan, prefs } = state;
  const done = state.completed.length;
  const total = done + plan.stops.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const clock0 = parseLocal(prefs.visitStart).minutes + state.usedMinutes;
  const next = plan.stops[0];
  const changes = state.changes.filter((c) => c.changed !== false);
  const change = changes[0];
  const adjust = (m: number) => update((s) => setRemainingMinutes(s, m));
  const notes = plan.notes ?? plan.warnings.map((w) => ({ k: "warn.partial", v: { text: w } }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold leading-tight">{t("t.h1")}</h1>

      <section aria-label={t("t.progressAria")} className="card mt-3 p-4">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span>
            {t("t.progress", { seen: done, togo: plan.stops.length })}
            {state.skipped.length ? t("t.skippedN", { n: state.skipped.length }) : ""}
          </span>
          <span className="text-right text-muted">{t("t.used", { n: state.usedMinutes })}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-50 ring-1 ring-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("t.progressAria")}>
          <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="label">{t("t.remaining")}</p>
            <p className="text-lg">
              <strong className={plan.totalMinutes > state.remainingMinutes ? "text-oxblood" : ""}>{plan.totalMinutes} min</strong>{" "}
              <span className="text-sm text-muted">{t("t.of", { n: state.remainingMinutes, time: toHHMM(clock0 + plan.totalMinutes) })}</span>
            </p>
          </div>
          <div>
            <p className="label" id="time-l">
              {t("t.timeLeft")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5" role="group" aria-labelledby="time-l">
              <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => adjust(state.remainingMinutes - 10)} disabled={state.remainingMinutes <= 0}>
                −10
              </button>
              <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => adjust(state.remainingMinutes - 5)} disabled={state.remainingMinutes <= 0}>
                −5
              </button>
              <form
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = parseInt(timeInput, 10);
                  if (Number.isFinite(n)) adjust(n);
                }}
              >
                <input
                  aria-label={t("t.minutesLeft")}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={480}
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="min-h-10 w-16 rounded-lg border border-line px-2 text-center"
                />
                <button type="submit" className="btn-ghost min-h-10 px-2 text-sm">
                  {t("t.set")}
                </button>
              </form>
              <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => adjust(state.remainingMinutes + 5)}>
                +5
              </button>
              <button type="button" className="btn-secondary min-h-10 px-3" onClick={() => adjust(state.remainingMinutes + 10)}>
                +10
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-3 space-y-2" aria-live="polite">
        {change && (
          <Notice tone="change">
            <strong>{t("t.why")}</strong> <ChangeText note={change} />
            {changes.length > 1 && (
              <button type="button" className="ml-2 text-xs font-semibold underline" onClick={() => setShowLog((v) => !v)} aria-expanded={showLog}>
                {showLog ? t("t.hideHistory") : t("t.history", { n: changes.length })}
              </button>
            )}
            {showLog && (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
                {changes.slice(1).map((c) => (
                  <li key={c.at + c.message}>
                    <ChangeText note={c} />
                  </li>
                ))}
              </ol>
            )}
          </Notice>
        )}
        {notes.map((n) => (
          <Notice key={n.k + JSON.stringify(n.v ?? {})} tone="warn">
            {renderCode(lang, n)}
          </Notice>
        ))}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section aria-labelledby="map-h">
          <h2 id="map-h" className="mb-2 text-xl font-semibold">
            {t("t.map")}
          </h2>
          <GalleryMap state={state} />
        </section>

        <section aria-labelledby="rem-h">
          <div className="flex items-center justify-between gap-2">
            <h2 id="rem-h" className="text-xl font-semibold">
              {t("t.remainingStops")}
            </h2>
            {next && (
              <Link href={`/guide/${encodeURIComponent(next.objectId)}`} className="btn-primary min-h-10">
                {t("t.goNext")}
              </Link>
            )}
          </div>
          {plan.stops.length ? (
            <ol className="mt-3 space-y-3">
              {plan.stops.map((s, i) => (
                <StopCard key={s.objectId} stop={s} number={done + i + 1} clockStart={clock0} highlight={change?.added.includes(s.objectId)} />
              ))}
            </ol>
          ) : (
            <div className="mt-3">
              <Empty title={t("t.noneTitle")}>
                {state.remainingMinutes < 5 ? t("t.noneOut") : t("t.noneAdd")}{" "}
                <Link href="/summary" className="underline">
                  {t("t.review")}
                </Link>
                .
              </Empty>
            </div>
          )}

          {state.completed.length > 0 && (
            <div className="mt-5">
              <h3 className="label">{t("t.completed")}</h3>
              <ul className="mt-2 space-y-1">
                {state.completed.map((c, i) => (
                  <li key={c.objectId}>
                    <Link href={`/guide/${encodeURIComponent(c.objectId)}`} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-white">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9b9387] text-xs font-bold text-white">{i + 1}</span>
                      {OBJECTS_BY_ID[c.objectId].shortTitle}
                      <span className="ml-auto text-xs text-muted">{ROOMS[c.roomId].shortName} ✓</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state.skipped.length > 0 && (
            <div className="mt-4">
              <h3 className="label">{t("t.skippedList")}</h3>
              <ul className="mt-2 space-y-1">
                {state.skipped.map((id) => (
                  <li key={id} className="flex min-h-11 items-center gap-2 px-2 text-sm">
                    <Link href={`/guide/${encodeURIComponent(id)}`} className="underline">
                      {OBJECTS_BY_ID[id].shortTitle}
                    </Link>
                    <button type="button" className="btn-ghost ml-auto min-h-9 px-3 text-xs" onClick={() => update((s) => unskip(s, id))}>
                      {t("t.allowAgain")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/itinerary" className="btn-secondary">
              {t("t.full")}
            </Link>
            <Link href="/summary" className="btn-secondary">
              {t("t.finish")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
