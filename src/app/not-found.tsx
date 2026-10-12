"use client";

import Link from "next/link";
import { useVisit } from "@/lib/store";

export default function NotFound() {
  const { t } = useVisit();
  return (
    <div className="card mx-auto max-w-md px-5 py-8 text-center">
      <h1 className="text-2xl font-semibold">{t("nf.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("nf.body")}</p>
      <Link href="/tour" className="btn-primary mt-4">
        {t("nf.back")}
      </Link>
    </div>
  );
}
