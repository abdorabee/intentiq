import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase";
import DashboardNav from "@/components/dashboard/nav";

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
    <div className="relative min-h-screen bg-[#040814] overflow-hidden">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-60 -left-40 w-[800px] h-[800px] rounded-full bg-cyan-500/12 blur-[150px] animate-orb" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-teal-500/8 blur-[130px] animate-orb-slow" />
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-sky-600/10 blur-[120px] animate-orb-med" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-cyan-400/6 blur-[100px] animate-orb" />
      </div>

      <div className="relative flex min-h-screen">
        <DashboardNav creditsRemaining={creditsRemaining} />
        <main className="flex-1 p-6 lg:p-10 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
