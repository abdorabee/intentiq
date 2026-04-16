import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up — Start Free",
  description: "Create your free IntentIQ account. 20 credits, no credit card required. Start scoring companies for buying intent today.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignUp fallbackRedirectUrl="/dashboard" />;
}
