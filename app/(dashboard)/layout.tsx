import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase";
import DashboardNav from "@/components/dashboard/nav";
import ChatTrigger from "@/components/chat/chat-trigger";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  // Provision user row in Supabase on first login (no-op if already exists)
  const user = await currentUser();
  const admin = createSupabaseAdmin();
  const [, { data: profile }] = await Promise.all([
    admin.from("users").upsert(
      {
        id: userId,
        email: user?.emailAddresses[0]?.emailAddress ?? "",
        plan: "free",
        credits_remaining: 20,
      },
      { onConflict: "id", ignoreDuplicates: true }
    ),
    admin.from("users").select("credits_remaining").eq("id", userId).single(),
  ]);

  const creditsRemaining = profile?.credits_remaining ?? 0;

  return (
    <div className="relative min-h-screen bg-white dark:bg-black overflow-hidden" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
      {/* Subtle wireframe grid background */}
      <div className="fixed inset-0 pointer-events-none dark:block hidden" aria-hidden>
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(6, 182, 212, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.08)_0%,transparent_50%)]" />
      </div>
      <div className="fixed inset-0 pointer-events-none dark:hidden block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.05)_0%,transparent_50%)]" />
      </div>

      <div className="relative flex min-h-screen">
        <DashboardNav creditsRemaining={creditsRemaining} />
        <main className="flex-1 p-4 pt-16 lg:p-10 lg:pt-10 max-w-5xl">{children}</main>
      </div>
      <ChatTrigger creditsRemaining={creditsRemaining} />
    </div>
  );
}
