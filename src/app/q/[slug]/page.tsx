import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { QuestionView } from "@/components/question/question-view";
import { QUESTION_BY_SLUG, QUESTIONS } from "@/lib/data/questions";

export function generateStaticParams() {
  return QUESTIONS.map((q) => ({ slug: q.slug }));
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const q = QUESTION_BY_SLUG.get(slug);
  if (!q) notFound();

  return (
    <AppShell>
      <QuestionView q={q} />
    </AppShell>
  );
}
