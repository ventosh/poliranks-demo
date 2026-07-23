import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PoliticianView } from "@/components/politicians/politician-view";
import { POLITICIANS, POLITICIAN_BY_SLUG } from "@/lib/data/politicians";

export function generateStaticParams() {
  return POLITICIANS.map((p) => ({ slug: p.slug }));
}

export default async function PoliticianPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = POLITICIAN_BY_SLUG.get(slug);
  if (!p) notFound();

  return (
    <AppShell>
      <PoliticianView p={p} />
    </AppShell>
  );
}
