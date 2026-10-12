"use client";

import { useState } from "react";
import { useVisit } from "@/lib/store";
import type { MuseumObject } from "@/lib/types";
import type { ResponseSource } from "@/lib/visit";

export function SourceTag({ source, notice }: { source?: ResponseSource; notice?: string }) {
  const { t } = useVisit();
  if (!source) return null;
  const cls = source === "live" ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn";
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{t(`src.${source}`)}</span>
      {notice && <span className="text-[11px] text-warn">{notice}</span>}
    </span>
  );
}

export function ObjectImage({ o, className = "", sizes = "small" }: { o: MuseumObject; className?: string; sizes?: "small" | "large" }) {
  const { t } = useVisit();
  const fit = sizes === "large" ? "object-contain" : "object-cover";
  const [failed, setFailed] = useState(false);
  const show = o.image.usePermitted && o.image.url && !failed;
  if (!show) {
    return (
      <div
        className={`flex items-center justify-center bg-[repeating-linear-gradient(45deg,#ece6db,#ece6db_8px,#f4efe6_8px,#f4efe6_16px)] p-2 text-center text-xs text-muted ${className}`}
        role="img"
        aria-label={t("img.noneAria", { name: o.shortTitle })}
      >
        <span>
          {failed ? t("img.failed") : t("img.notShown")}
          {sizes === "large" && <span className="mt-1 block text-[11px]">{failed ? t("img.failedHelp") : t("img.noLicence")}</span>}
        </span>
      </div>
    );
  }
  return (
    // Plain <img>: the Museum media server provides sized previews (≤750px, as permitted for non-commercial use).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={o.image.url!}
      alt={`${o.title}, ${o.date}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`bg-[#ece6db] ${fit} ${className}`}
    />
  );
}

export function Credit({ o }: { o: MuseumObject }) {
  const { t } = useVisit();
  if (!o.image.usePermitted) return null;
  return (
    <p className="text-[11px] leading-snug text-muted">
      {t("img.credit")} {o.image.credit}{" "}
      <a className="underline" href={o.image.licenseUrl ?? "#"} target="_blank" rel="noreferrer">
        {t("img.licence")}
      </a>
      {o.image.permissionPage && (
        <>
          {" · "}
          <a className="underline" href={o.image.permissionPage} target="_blank" rel="noreferrer">
            {t("img.permission")}
          </a>
        </>
      )}
    </p>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "change"; children: React.ReactNode }) {
  const cls = {
    info: "border-line bg-white text-ink",
    warn: "border-gold/50 bg-warn-soft text-warn",
    change: "border-accent/40 bg-accent-soft text-accent",
  }[tone];
  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${cls}`}>{children}</div>;
}

export function Spinner({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
      {label}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card mx-auto max-w-md px-5 py-8 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-muted">{children}</div>
    </div>
  );
}
