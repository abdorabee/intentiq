import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import LandingPage from "@/components/landing";

// Root "/" — dashboard if logged in, marketing landing page if not
export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LandingPage />;
}
