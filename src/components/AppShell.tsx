"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LANGS, isLang, langName } from "@/lib/i18n";
import { useVisit } from "@/lib/store";

const NAV = [
  { href: "/plan", key: "nav.plan", icon: "M4 6h16M4 12h10M4 18h7" },
  { href: "/tour", key: "nav.tour", icon: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { href: "/summary", key: "nav.summary", icon: "M5 13l4 4L19 7" },
];

export function ModeSwitch() {
  const { state, ai, setMode, t } = useVisit();
  const live = state.aiMode === "live";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={live}
      aria-label={live ? t("mode.live") : t("mode.demo")}
      disabled={!ai.live}
      onClick={() => setMode(live ? "demo" : "live")}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
        live ? "border-accent bg-accent text-white" : "border-gold/60 bg-warn-soft text-warn"
      } disabled:cursor-not-allowed`}
      title={ai.live ? t("mode.help") : t("mode.unavailable")}
    >
      <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${live ? "bg-emerald-300" : "bg-gold"}`} />
      <span className="sm:hidden">{live ? t("mode.liveShort") : t("mode.demoShort")}</span>
      <span className="hidden sm:inline">{live ? t("mode.live") : t("mode.demo")}</span>
    </button>
  );
}

export function LanguageSelect() {
  const { lang, setLang, t } = useVisit();
  const cur = LANGS.find((l) => l.id === lang)!;
  return (
    <label className="relative inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-sm font-medium text-ink focus-within:outline focus-within:outline-3 focus-within:outline-gold hover:border-accent">
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
      </svg>
      <span aria-hidden className="sm:hidden">{cur.short}</span>
      <span aria-hidden className="hidden sm:inline">{cur.label}</span>
      <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 text-muted" fill="currentColor">
        <path d="M2 4l4 4 4-4z" />
      </svg>
      {/* Native select on top (invisible) so the system picker and keyboard support work everywhere. */}
      <select
        value={lang}
        onChange={(e) => isLang(e.target.value) && setLang(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={t("lang.label")}
      >
        {LANGS.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { storageOk, t, lang, state } = useVisit();
  const active = (href: string) => path.startsWith(href) || (href === "/tour" && (path.startsWith("/guide") || path.startsWith("/itinerary")));
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <Link href="/" className="min-w-0" aria-label={t("home.aria")}>
            <span className="serif block truncate text-lg font-semibold leading-tight text-ink">{t("app.title")}</span>
            <span className="block truncate text-xs text-muted">{t("app.subtitle")}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <LanguageSelect />
            <ModeSwitch />
          </div>
        </div>
        <nav aria-label="Main" className="hidden border-t border-line px-2 sm:block">
          <ul className="flex gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active(n.href) ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center px-3 text-sm font-medium ${active(n.href) ? "border-b-2 border-accent text-accent" : "text-muted hover:text-ink"}`}
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {!storageOk && (
        <p role="status" className="bg-warn-soft px-4 py-2 text-sm text-warn">
          {t("storage.blocked")}
        </p>
      )}
      {lang !== "en" && state.aiMode !== "live" && (
        <p role="status" className="bg-warn-soft px-4 py-1.5 text-xs text-warn">
          {t("lang.demoNote", { lang: LANGS.find((l) => l.id === lang)?.label ?? langName(lang) })}
        </p>
      )}

      <main className="flex-1 px-4 pb-28 pt-4 sm:pb-10">{children}</main>

      <footer className="border-t border-line px-4 py-5 pb-28 text-xs leading-relaxed text-muted sm:pb-6">
        <p>
          {t("footer.text")}{" "}
          <Link href="/about" className="underline">
            {t("footer.link")}
          </Link>
        </p>
      </footer>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur sm:hidden">
        <ul className="grid grid-cols-3">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active(n.href) ? "text-accent" : "text-muted"}`}
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.icon} />
                </svg>
                {t(n.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
