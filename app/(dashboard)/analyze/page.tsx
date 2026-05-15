import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import AnalyzeView from "./analyze-view";

export default async function AnalyzePage() {
  const { userId } = await auth();
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("users").select("credits_remaining").eq("id", userId!).single();
  return <AnalyzeView creditsRemaining={data?.credits_remaining ?? 0} />;
}
