import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export function AppShell({
  children,
  ticker,
}: {
  children: React.ReactNode;
  ticker?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader ticker={ticker} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-4 md:pb-8">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
