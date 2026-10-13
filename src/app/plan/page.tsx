"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Notice, Spinner } from "@/components/ui";
import { ON_DISPLAY, OBJECTS_BY_ID } from "@/data/objects";
import { ROOMS } from "@/data/rooms";
import { postJson, useVisit } from "@/lib/store";
import { hoursText, listJoin, styleLabel, tagLabel, type T } from "@/lib/i18n";
import { TAGS } from "@/lib/tags";
import type { GuideStyle, Preferences, RoomId, TagId } from "@/lib/types";
import { createVisit } from "@/lib/visit";

/** Longest visit accepted: 10 hours (a Friday late opening runs 10.00 to 20.20). */
const MAX_HOURS = 10;
const MAX_MINUTES = MAX_HOURS * 60;
const parseHours = (v: string) => parseFloat(v.replace(",", "."));
/** Quick choices from a short visit to most of a day (minutes; shown in hours). */
const TIMES = [30, 60, 120, 180, 240, 360];
const STYLES: GuideStyle[] = ["approachable", "in-depth", "playful", "family"];
const LOCALE = { en: "en-GB", zh: "zh-CN", es: "es-ES", fr: "fr-FR" } as const;
const STARTS: RoomId[] = ["GC", "24", "4", "1", "18"];

function londonNow(): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    return `${g("year")}-${g("month")}-${g("day")}T${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}`;
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
}

/** "Now" in London, or the next gallery opening (10:00) if the galleries are closed now. */
function defaultStart(): { value: string; closed: boolean } {
  const now = londonNow();
  const [d, t] = now.split("T");
  const [h, m] = t.split(":").map(Number);
  const mins = h * 60 + m;
  const date = new Date(`${d}T12:00:00Z`);
  const lastStart = date.getUTCDay() === 5 ? 20 * 60 : 16 * 60 + 30;
  const closedDay = (x: Date) => ["12-24", "12-25", "12-26"].includes(x.toISOString().slice(5, 10));
  if (mins >= 10 * 60 && mins <= lastStart && !closedDay(date)) return { value: now, closed: false };
  const next = new Date(date);
  if (mins > lastStart || closedDay(date)) next.setUTCDate(next.getUTCDate() + 1);
  while (closedDay(next)) next.setUTCDate(next.getUTCDate() + 1);
  return { value: `${next.toISOString().slice(0, 10)}T10:00`, closed: true };
}

function formatStart(v: string, locale: string = "en-GB") {
  const [d, t] = v.split("T");
  const date = new Date(`${d}T12:00:00Z`);
  return `${date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}, ${t}`;
}

type Step = 0 | 1 | 2 | 3 | 4;

function GuideBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span aria-hidden className="serif mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
        G
      </span>
      <div className="card max-w-[46ch] rounded-tl-sm px-3.5 py-2.5 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

function VisitorBubble({ children, onEdit, t }: { children: React.ReactNode; onEdit?: () => void; t: T }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[46ch] rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2.5 text-[15px] leading-relaxed text-white">
        {children}
        {onEdit && (
          <button type="button" onClick={onEdit} className="ml-2 inline-flex min-h-8 items-center text-xs font-semibold text-white/85 underline">
            {t("common.edit")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { state, hydrated, update, t, lang } = useVisit();
  const locale = LOCALE[lang];
  const router = useRouter();
  const existing = state.prefs;

  const [step, setStep] = useState<Step>(0);
  const [minutes, setMinutes] = useState(60);
  const [customTime, setCustomTime] = useState("");
  const [visitStart, setVisitStart] = useState<string>("");
  const [editStart, setEditStart] = useState(false);
  const [startClosed, setStartClosed] = useState(false);
  const [interests, setInterests] = useState<TagId[]>([]);
  const [freeText, setFreeText] = useState("");
  const [style, setStyle] = useState<GuideStyle>("approachable");
  const [mustSee, setMustSee] = useState<string[]>([]);
  const [startRoom, setStartRoom] = useState<RoomId>("GC");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [newChat, setNewChat] = useState(false);
  const showChat = !existing || newChat;

  function resetAnswers() {
    const d = defaultStart();
    setVisitStart(d.value);
    setStartClosed(d.closed);
    setEditStart(false);
    setMinutes(60);
    setCustomTime("");
    setInterests([]);
    setFreeText("");
    setStyle("approachable");
    setMustSee([]);
    setStartRoom("GC");
    setQuery("");
    setError(null);
    setStep(0);
  }

  // Start with fresh defaults once hydrated (a saved plan is shown as a summary, not prefilled).
  useEffect(() => {
    if (hydrated) resetAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function startNewChat() {
    resetAnswers();
    setNewChat(true);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (step > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ON_DISPLAY.filter((o) => !mustSee.includes(o.id) && `${o.title} ${o.shortTitle} ${o.museumNumber}`.toLowerCase().includes(q)).slice(0, 6);
  }, [query, mustSee]);

  const toggleTag = (tg: TagId) => setInterests((xs) => (xs.includes(tg) ? xs.filter((x) => x !== tg) : [...xs, tg]));

  async function plan() {
    setBusy(true);
    setError(null);
    let derived = { tags: [] as TagId[], objectIds: [] as string[], note: "" };
    if (freeText.trim()) {
      try {
        const r = await postJson<{ tags: TagId[]; objectIds: string[]; note: string }>("/api/interpret", {
          text: freeText,
          mode: state.aiMode,
          language: lang,
        });
        derived = r;
      } catch {
        setError(t("w.interpretFail"));
      }
    }
    const prefs: Preferences = {
      minutes,
      interests,
      freeText: freeText.trim(),
      derivedTags: derived.tags,
      derivedObjectIds: derived.objectIds,
      interpretationNote: derived.note,
      style,
      mustSee,
      startRoom,
      visitStart: visitStart || defaultStart().value,
    };
    update((s) => createVisit(s, prefs));
    setBusy(false);
    router.push("/tour");
  }

  if (!hydrated) return <Spinner label={t("common.loading")} />;

  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-5">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{t("w.h1")}</h1>
        <p className="mt-2 text-[15px] text-muted">{t("w.intro", { rooms: Object.keys(ROOMS).length - 1, n: ON_DISPLAY.length })}</p>
      </section>

      {existing && state.plan && !newChat && (
        <section className="card p-4" aria-labelledby="cur-h">
          <h2 id="cur-h" className="text-lg font-semibold">
            {t("w.current")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("w.resume", { seen: state.completed.length, togo: state.plan.stops.length })}</p>
          <ul className="mt-2 space-y-0.5 text-sm">
            <li>{t("w.answerTime", { time: hoursText(lang, existing.minutes), when: formatStart(existing.visitStart, locale) })}</li>
            <li>{existing.interests.length ? listJoin(lang, existing.interests.map((x) => tagLabel(lang, x))) : t("w.noThemes")}</li>
            {existing.freeText && <li className="text-muted">“{existing.freeText}”</li>}
            <li>{styleLabel(lang, existing.style)}</li>
            {existing.mustSee.length > 0 && <li>{t("w.mustSummary", { list: listJoin(lang, existing.mustSee.map((id) => OBJECTS_BY_ID[id]?.shortTitle ?? id)) })}</li>}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/tour" className="btn-primary">
              {t("w.resumeLink")}
            </Link>
            <button type="button" className="btn-secondary" onClick={startNewChat}>
              {t("w.replanStart")}
            </button>
          </div>
        </section>
      )}

      {existing && newChat && (
        <Notice tone="change">
          {t("w.newChatNote")}{" "}
          <button type="button" className="font-semibold underline" onClick={() => setNewChat(false)}>
            {t("w.keepPlan")}
          </button>
        </Notice>
      )}

      {showChat && (
      <div className="mt-5 space-y-4" aria-live="polite">
        <GuideBubble>
          {t("w.q1")}
        </GuideBubble>

        {step === 0 ? (
          <div className="card space-y-3 p-4">
            <div role="radiogroup" aria-label={t("w.q1")} className="flex flex-wrap gap-2">
              {TIMES.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={minutes === m && !customTime} className="chip" onClick={() => (setMinutes(m), setCustomTime(""))}>
                  {hoursText(lang, m)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              {t("w.other")}
              <input
                type="number"
                inputMode="decimal"
                min={0.5}
                max={MAX_HOURS}
                step={0.5}
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  const h = parseHours(e.target.value);
                  // Every keystroke updates the plan length; minimum 15 minutes, maximum 10 hours.
                  if (h > 0) setMinutes(Math.min(Math.max(15, Math.round(h * 60)), MAX_MINUTES));
                }}
                className="min-h-11 w-24 rounded-lg border border-line px-3"
                aria-label={t("w.customAria")}
              />
              {t("w.minutes")}
            </label>
            {parseHours(customTime) > MAX_HOURS && <p className="text-xs text-warn">{t("w.customMax", { max: MAX_HOURS })}</p>}
            <div className="text-sm">
              <span className="text-muted">{t("w.starting")} </span>
              {editStart ? (
                <input
                  type="datetime-local"
                  value={visitStart}
                  onChange={(e) => e.target.value && setVisitStart(e.target.value)}
                  className="min-h-11 rounded-lg border border-line px-2"
                  aria-label={t("w.startAria")}
                />
              ) : (
                <>
                  <strong>{visitStart ? formatStart(visitStart, locale) : t("w.now")}</strong> {t("w.london")}{" "}
                  <button type="button" className="btn-ghost min-h-9 px-2 text-sm" onClick={() => setEditStart(true)}>
                    {t("w.change")}
                  </button>
                </>
              )}
              {startClosed && <p className="mt-1 text-xs text-warn">{t("w.closedNote")}</p>}
              <p className="mt-1 text-xs text-muted">{t("w.startHelp")}</p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setStep(1)}>
              {t("common.next")}
            </button>
          </div>
        ) : (
          <VisitorBubble t={t} onEdit={() => setStep(0)}>
            {t("w.answerTime", { time: hoursText(lang, minutes), when: formatStart(visitStart, locale) })}
          </VisitorBubble>
        )}

        {step >= 1 && (
          <GuideBubble>
            {t("w.q2")}
          </GuideBubble>
        )}
        {step === 1 && (
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("w.interests")}>
              {TAGS.map((tg) => (
                <button key={tg.id} type="button" aria-pressed={interests.includes(tg.id)} className="chip" onClick={() => toggleTag(tg.id)}>
                  {tagLabel(lang, tg.id)}
                </button>
              ))}
            </div>
            <label className="block text-sm">
              <span className="text-muted">{t("w.ownWords")}</span>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={t("w.ownPh")}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-[15px]"
              />
            </label>
            <button type="button" className="btn-primary" onClick={() => setStep(2)}>
              {t("common.next")}
            </button>
          </div>
        )}
        {step > 1 && (
          <VisitorBubble t={t} onEdit={() => setStep(1)}>
            {interests.length ? listJoin(lang, interests.map((x) => tagLabel(lang, x))) : t("w.noThemes")}
            {freeText && <span className="block text-white/85">“{freeText}”</span>}
          </VisitorBubble>
        )}

        {step >= 2 && (
          <GuideBubble>
            {t("w.q3")}
          </GuideBubble>
        )}
        {step === 2 && (
          <div className="card space-y-3 p-4">
            <div role="radiogroup" aria-label={t("w.styleAria")} className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={style === s} className="chip flex-col !items-start !rounded-xl text-left" onClick={() => setStyle(s)}>
                  <span className="font-semibold">{styleLabel(lang, s)}</span>
                  <span className="text-xs opacity-80">{t(`hint.${s}`)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="btn-primary" onClick={() => setStep(3)}>
              {t("common.next")}
            </button>
          </div>
        )}
        {step > 2 && (
          <VisitorBubble t={t} onEdit={() => setStep(2)}>
            {styleLabel(lang, style)}
          </VisitorBubble>
        )}

        {step >= 3 && (
          <GuideBubble>
            {t("w.q4")}
          </GuideBubble>
        )}
        {step === 3 && (
          <div className="card space-y-3 p-4">
            <label className="block text-sm">
              <span className="text-muted">{t("w.search")}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("w.searchPh")}
                className="mt-1 min-h-11 w-full rounded-lg border border-line px-3"
              />
            </label>
            {query && !matches.length && <p className="text-sm text-muted">{t("w.noMatch", { q: query })}</p>}
            {matches.length > 0 && (
              <ul className="space-y-1">
                {matches.map((o) => (
                  <li key={o.id}>
                    <button type="button" className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm hover:bg-stone-50" onClick={() => (setMustSee((m) => [...m, o.id]), setQuery(""))}>
                      <span>
                        {o.shortTitle} <span className="text-muted">· {ROOMS[o.display.roomId!].shortName}</span>
                      </span>
                      <span className="text-accent">{t("w.add")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {mustSee.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={t("w.mustAria")}>
                {mustSee.map((id) => (
                  <li key={id}>
                    <button type="button" className="chip" aria-pressed="true" onClick={() => setMustSee((m) => m.filter((x) => x !== id))} aria-label={t("w.remove", { name: OBJECTS_BY_ID[id].shortTitle })}>
                      {OBJECTS_BY_ID[id].shortTitle} ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="block text-sm">
              <span className="text-muted">{t("w.startPoint")}</span>
              <select value={startRoom} onChange={(e) => setStartRoom(e.target.value as RoomId)} className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3">
                {STARTS.map((r) => (
                  <option key={r} value={r}>
                    {r === "GC" ? t("w.gcStart") : ROOMS[r].name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn-primary" onClick={() => setStep(4)}>
              {mustSee.length ? t("common.next") : t("w.nextNoMust")}
            </button>
          </div>
        )}
        {step > 3 && (
          <VisitorBubble t={t} onEdit={() => setStep(3)}>
            {mustSee.length ? t("w.mustSummary", { list: listJoin(lang, mustSee.map((id) => OBJECTS_BY_ID[id].shortTitle)) }) : t("w.noMust")} ·{" "}
            {t("w.startAt", { room: ROOMS[startRoom].shortName })}
          </VisitorBubble>
        )}

        {step === 4 && (
          <>
            <GuideBubble>
              {t("w.thanks", { time: hoursText(lang, minutes) })}
            </GuideBubble>
            <div className="sticky bottom-20 z-10 flex flex-col gap-2 sm:bottom-4">
              <button type="button" className="btn-primary min-h-12 text-base shadow-lg" onClick={plan} disabled={busy}>
                {busy ? t("w.planningBtn") : existing ? t("w.replan") : t("w.plan")}
              </button>
              {existing && (
                <p className="text-center text-xs text-muted">{t("w.replanNote")}</p>
              )}
            </div>
          </>
        )}
        {busy && <Spinner label={freeText ? t("w.planningNote") : t("w.planning")} />}
        {error && <Notice tone="warn">{error}</Notice>}
        <div ref={endRef} />
      </div>
      )}
    </div>
  );
}
