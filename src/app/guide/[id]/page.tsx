import { notFound } from "next/navigation";
import { GuideView } from "@/components/GuideView";
import { OBJECTS, OBJECTS_BY_ID } from "@/data/objects";

export function generateStaticParams() {
  return OBJECTS.map((o) => ({ id: o.id }));
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  if (!OBJECTS_BY_ID[decoded]) notFound();
  return <GuideView id={decoded} />;
}
