import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import DashboardNav from "@/components/dashboard/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
