"use client";

import { useRouter } from "next/navigation";
import ChatPanel from "@/components/chat/chat-panel";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";

export default function AnalyzeView({ creditsRemaining }: { creditsRemaining: number }) {
  const router = useRouter();

  return (
    <DashboardPageShell
      eyebrow="Analyze"
      title="Intent Copilot"
      description="Ask about your pipeline, score companies, draft outreach — powered by your workspace context."
      maxWidthClass="max-w-4xl w-full"
      className="flex min-h-0 flex-1 flex-col space-y-0 gap-4"
    >
      <div className="flex min-h-0 flex-1 flex-col" style={{ minHeight: "min(70vh, 640px)" }}>
        <ChatPanel
          embedded
          isOpen
          creditsRemaining={creditsRemaining}
          onClose={() => router.push("/dashboard")}
        />
      </div>
    </DashboardPageShell>
  );
}
