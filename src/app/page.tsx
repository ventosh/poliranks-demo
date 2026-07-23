import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <h1 className="text-3xl font-bold font-heading">מה זז במדינה עכשיו</h1>
        <p className="text-muted-foreground">
          עמוד הבית בבנייה — טיקר, מזנקים ואירועים בדרך.
        </p>
      </div>
    </AppShell>
  );
}
