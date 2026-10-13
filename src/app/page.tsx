"use client";

import Link from "next/link";
import { useState } from "react";
import { useVisit } from "@/lib/store";

/** Façade photo: Wikimedia Commons, by "Ham", CC BY-SA 3.0 (hot-linked thumbnail, credited below). */
const HERO = {
  src: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/British_Museum_from_NE_2.JPG/1280px-British_Museum_from_NE_2.JPG",
  page: "https://commons.wikimedia.org/wiki/File:British_Museum_from_NE_2.JPG",
  author: "Ham",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
};

const FEATURES = [
  { key: "plan", icon: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { key: "explain", icon: "M8 10h8M8 14h5M21 12c0 4.4-4 8-9 8-1.5 0-3-.3-4.2-.9L3 20l1.2-3.8C3.4 15 3 13.5 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" },
  { key: "adapt", icon: "M4 4v6h6M20 20v-6h-6M5.6 15A8 8 0 0 0 19 17M18.4 9A8 8 0 0 0 5 7" },
] as const;

export default function FrontPage() {
  const { state, hydrated, t } = useVisit();
  const [imgOk, setImgOk] = useState(true);
  const inProgress = hydrated && !!state.prefs && !!state.plan;

  return (
    <div className="mx-auto max-w-4xl">
      <section className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={HERO.src}
            alt={t("home.photoAlt")}
            className="h-[22rem] w-full object-cover sm:h-[26rem]"
            onError={() => setImgOk(false)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-[22rem] w-full bg-[linear-gradient(135deg,#1f4d45,#173b35)] sm:h-[26rem]" role="img" aria-label={t("home.photoAlt")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{t("home.kicker")}</p>
          <h1 className="serif mt-1 text-4xl font-semibold leading-tight sm:text-5xl">{t("app.title")}</h1>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-white/90">{t("home.tagline")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/plan" className="btn bg-white text-accent hover:bg-paper">
              {inProgress ? t("home.newPlan") : t("home.cta")}
            </Link>
            {inProgress && (
              <Link href="/tour" className="btn border border-white/70 text-white hover:bg-white/10">
                {t("home.resume")}
              </Link>
            )}
          </div>
        </div>
      </section>
      <p className="mt-1.5 px-1 text-[11px] text-muted">
        {t("home.photoCredit")}{" "}
        <a href={HERO.page} className="underline" target="_blank" rel="noreferrer">
          {HERO.author}
        </a>
        , Wikimedia Commons,{" "}
        <a href={HERO.licenseUrl} className="underline" target="_blank" rel="noreferrer">
          {HERO.license}
        </a>
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label={t("home.featuresAria")}>
        {FEATURES.map((f) => (
          <div key={f.key} className="card p-4">
            <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7 text-accent" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d={f.icon} />
            </svg>
            <h2 className="mt-2 text-lg font-semibold">{t(`home.f.${f.key}`)}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t(`home.f.${f.key}.body`)}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 flex justify-center">
        <Link href="/plan" className="btn-primary min-h-12 px-8 text-base">
          {inProgress ? t("home.newPlan") : t("home.cta")}
        </Link>
      </div>
    </div>
  );
}
