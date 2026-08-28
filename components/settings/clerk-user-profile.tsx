"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { useTheme } from "@/components/theme-provider";

export function ClerkUserProfile() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="settings-clerk">
      <UserProfile
        routing="hash"
        appearance={{
          baseTheme: isDark ? dark : undefined,
          variables: {
            colorPrimary: "#dfff00",
            colorBackground: isDark ? "#111111" : "#ffffff",
            colorInputBackground: isDark ? "rgba(255,255,255,0.055)" : "#f7f8fa",
            colorInputText: isDark ? "#f7f8f8" : "#0a0e1a",
            colorText: isDark ? "#f7f8f8" : "#0a0e1a",
            colorTextSecondary: isDark ? "#a8afb9" : "#3a4150",
            colorDanger: isDark ? "#f87171" : "#dc2626",
            borderRadius: "8px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "14px",
          },
          elements: {
            rootBox: { width: "100%" },
            cardBox: { width: "100%", boxShadow: "none" },
            card: {
              background: "transparent",
              boxShadow: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              width: "100%",
            },
            navbar: {
              background: "transparent",
              borderRight: "1px solid var(--border)",
            },
            headerTitle: { color: "var(--text-primary)" },
            headerSubtitle: { color: "var(--text-tertiary)" },
            profileSectionTitleText: { color: "var(--text-primary)" },
            formButtonPrimary: {
              background: "var(--brand)",
              color: "#000000",
              fontWeight: "500",
            },
            badge: { display: "none" },
          },
        }}
      />
    </div>
  );
}
