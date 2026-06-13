import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata: Metadata = {
  title: "Sign Up — Start Free | VesperWise",
  description:
    "Create your free VesperWise account. 20 credits, no credit card required.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div style={{ width: "100%", maxWidth: "380px" }}>
      <SignUp
        fallbackRedirectUrl="/dashboard"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#5e6ad2",
            colorBackground: "#131517",
            colorInputBackground: "#0e1011",
            colorInputText: "#f7f8f8",
            colorText: "#f7f8f8",
            colorTextSecondary: "#b4bbc8",
            colorDanger: "#f87171",
            borderRadius: "6px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "14px",
          },
          layout: {
            logoPlacement: "none",
            socialButtonsVariant: "blockButton",
            socialButtonsPlacement: "top",
          },
          elements: {
            rootBox: { width: "100%" },
            card: {
              background: "#131517",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "12px",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px -12px rgba(0,0,0,0.6)",
              padding: "28px",
            },
            headerTitle: {
              fontSize: "20px",
              fontWeight: "600",
              letterSpacing: "-0.02em",
              color: "#f7f8f8",
            },
            headerSubtitle: { color: "#8a8f98", fontSize: "13px" },
            socialButtonsBlockButton: {
              background: "#1a1d20",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#f7f8f8",
            },
            socialButtonsBlockButtonText: { fontWeight: "500", color: "#f7f8f8" },
            dividerLine: { background: "rgba(255,255,255,0.07)" },
            dividerText: { color: "#62666d" },
            formFieldLabel: { color: "#b4bbc8" },
            formFieldInput: {
              background: "#0e1011",
              borderColor: "rgba(255,255,255,0.09)",
              color: "#f7f8f8",
            },
            formButtonPrimary: {
              background: "#5e6ad2",
              fontWeight: "600",
            },
            footerActionLink: { color: "#7170ff", fontWeight: "500" },
            footerActionText: { color: "#8a8f98" },
            badge: { display: "none" },
          },
        }}
      />
      <p
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#62666d",
          marginTop: "16px",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.06em",
        }}
      >
        20 FREE CREDITS · NO CREDIT CARD
      </p>
    </div>
  );
}
