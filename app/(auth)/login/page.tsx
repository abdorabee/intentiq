import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata: Metadata = {
  title: "Sign In — VesperWise",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div style={{ width: "100%", maxWidth: "380px" }}>
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#dfff00",
            colorBackground: "rgba(20,20,22,0.86)",
            colorInputBackground: "rgba(255,255,255,0.055)",
            colorInputText: "#f7f8f8",
            colorText: "#f7f8f8",
            colorTextSecondary: "#a8afb9",
            colorDanger: "#f87171",
            borderRadius: "16px",
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
              background: "rgba(20,20,22,0.82)",
              backdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "24px",
              boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 110px -30px rgba(0,0,0,0.9)",
              padding: "30px",
            },
            headerTitle: {
              fontSize: "24px",
              fontWeight: "650",
              letterSpacing: "0",
              color: "#f7f8f8",
            },
            headerSubtitle: { color: "#a8afb9", fontSize: "14px" },
            socialButtonsBlockButton: {
              background: "rgba(255,255,255,0.055)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#f7f8f8",
              borderRadius: "999px",
              minHeight: "42px",
            },
            socialButtonsBlockButtonText: { fontWeight: "500", color: "#f7f8f8" },
            dividerLine: { background: "rgba(255,255,255,0.07)" },
            dividerText: { color: "#62666d" },
            formFieldLabel: { color: "#b4bbc8" },
            formFieldInput: {
              background: "rgba(255,255,255,0.055)",
              borderColor: "rgba(255,255,255,0.10)",
              color: "#f7f8f8",
              borderRadius: "14px",
              minHeight: "42px",
            },
            formButtonPrimary: {
              background: "linear-gradient(180deg, #ecff58, #dfff00)",
              color: "#050505",
              fontWeight: "600",
              borderRadius: "999px",
              minHeight: "42px",
            },
            footerActionLink: { color: "#e8ff40", fontWeight: "500" },
            footerActionText: { color: "#8a8f98" },
            badge: { display: "none" },
            footer: { "& + *": { display: "none" } },
          },
        }}
      />
    </div>
  );
}
