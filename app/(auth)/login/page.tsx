import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In — IntentIQ",
  robots: { index: false, follow: false },
};

const clerkAppearance = {
  variables: {
    colorBackground: "#131517",
    colorInputBackground: "#1a1d20",
    colorInputText: "#f7f8f8",
    colorText: "#f7f8f8",
    colorTextSecondary: "#b4bbc8",
    colorPrimary: "#7170ff",
    colorDanger: "#f87171",
    borderRadius: "6px",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      boxShadow: "none",
      background: "transparent",
      border: "none",
      borderRadius: "0",
    },
    headerTitle: { color: "#f7f8f8", fontWeight: "600" },
    headerSubtitle: { color: "#b4bbc8" },
    socialButtonsBlockButton: {
      background: "#1a1d20",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#f7f8f8",
    },
    socialButtonsBlockButton__hover: {
      background: "#1f2226",
      borderColor: "rgba(255,255,255,0.13)",
    },
    dividerLine: { background: "rgba(255,255,255,0.08)" },
    dividerText: { color: "#8a8f98" },
    formFieldLabel: { color: "#b4bbc8" },
    formFieldInput: {
      background: "#1a1d20",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#f7f8f8",
      borderRadius: "6px",
    },
    formButtonPrimary: {
      background: "#5e6ad2",
      color: "#ffffff",
      fontWeight: "500",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.3)",
    },
    footerActionLink: { color: "#7170ff" },
    identityPreviewText: { color: "#f7f8f8" },
    identityPreviewEditButton: { color: "#7170ff" },
  },
} as const;

export default function LoginPage() {
  return (
    <SignIn
      fallbackRedirectUrl="/dashboard"
      appearance={clerkAppearance}
    />
  );
}
