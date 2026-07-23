"use client";

import * as React from "react";
import { Inbox, ShieldAlert, Bot, FolderKanban, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSim } from "@/lib/sim/use-sim";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalQueue } from "@/components/admin/approval-queue";
import { ContentTab } from "@/components/admin/content-tab";
import { TrustTab } from "@/components/admin/trust-tab";
import { AgentsTab } from "@/components/admin/agents-tab";

export function AdminView() {
  const sim = useSim();

  if (!sim) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading">חדר העריכה</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            AI מציע · אדם מאשר — שום דבר לא מתפרסם בלי חתימה אנושית
          </p>
        </div>
        <div className="ms-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs">
            <ShieldCheck className="size-3.5 text-up" />
            מיכל · עורכת · 2FA פעיל
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-live/30 bg-live/10 px-3 py-1 text-xs font-bold text-live">
            <Inbox className="size-3.5" />
            <bdi className="num">{sim.snap.queueDepth}</bdi> ממתינות לאישור
          </span>
        </div>
      </div>

      <Tabs defaultValue="queue" dir="rtl" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="queue" className="gap-1.5">
            <Inbox className="size-3.5" />
            תור אישורים
            <bdi className="num rounded-full bg-live/15 px-1.5 text-[10px] font-bold text-live">
              {sim.snap.queueDepth}
            </bdi>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5">
            <FolderKanban className="size-3.5" />
            תוכן ויומן
          </TabsTrigger>
          <TabsTrigger value="trust" className="gap-1.5">
            <ShieldAlert className="size-3.5" />
            אמון וחריגות
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1.5">
            <Bot className="size-3.5" />
            תפעול סוכנים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <ApprovalQueue sim={sim} />
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          <ContentTab />
        </TabsContent>
        <TabsContent value="trust" className="mt-4">
          <TrustTab sim={sim} />
        </TabsContent>
        <TabsContent value="agents" className="mt-4">
          <AgentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
