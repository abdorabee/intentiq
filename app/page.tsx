import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

// Root "/" — dashboard if logged in, marketing landing page if not
export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return <LandingPage />;
}
