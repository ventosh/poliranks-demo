import { AppShell } from "@/components/layout/app-shell";
import { LiveChart } from "@/components/market/live-chart";

export default function Home() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="mb-4 text-2xl font-bold font-heading">
          בדיקת גרף חי — חוק הגיוס
        </h1>
        <LiveChart slug="giyus" />
      </div>
    </AppShell>
  );
}
