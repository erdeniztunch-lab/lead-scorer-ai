import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DemoControlBar } from "@/components/demo/DemoControlBar";
import { loadDemoSessionState, type DemoScenarioId } from "@/lib/demoStore";

interface DashboardShellProps {
  title: string;
  children: ReactNode;
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const [demoEnabled, setDemoEnabled] = useState(() => loadDemoSessionState().enabled);
  const [activeScenarioId, setActiveScenarioId] = useState<DemoScenarioId>(
    () => loadDemoSessionState().activeScenarioId ?? "high_intent_inbound",
  );

  useEffect(() => {
    const sync = () => {
      const next = loadDemoSessionState();
      setDemoEnabled(next.enabled);
      setActiveScenarioId(next.activeScenarioId ?? "high_intent_inbound");
    };
    window.addEventListener("lead-scorer:demo-session-updated", sync);
    return () => window.removeEventListener("lead-scorer:demo-session-updated", sync);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-b from-background to-muted/20">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
            <SidebarTrigger className="mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                <p className="text-xs text-muted-foreground">Prioritize next-best actions from explainable lead scores.</p>
              </div>
            </div>
          </header>
          <DemoControlBar
            enabled={demoEnabled}
            onEnabledChange={setDemoEnabled}
            activeScenarioId={activeScenarioId}
            onScenarioChange={setActiveScenarioId}
          />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
