import { AppShell } from "@/components/layout/app-shell";
import { HomeView } from "@/components/home/home-view";
import { Ticker } from "@/components/market/ticker";

export default function Home() {
  return (
    <AppShell ticker={<Ticker />}>
      <HomeView />
    </AppShell>
  );
}
