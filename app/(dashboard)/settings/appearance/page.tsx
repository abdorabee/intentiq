"use client";

import { toast } from "sonner";

import { useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/user-preferences";

const OPTIONS: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Bright surfaces for daytime use." },
  { value: "dark", label: "Dark", description: "The default VesperWise workspace." },
  { value: "system", label: "System", description: "Follow the operating system appearance." },
];

export default function AppearanceSettingsPage() {
  const { preference, setTheme } = useTheme();

  async function handleSelect(next: ThemePreference) {
    if (next === preference) return;
    const result = await setTheme(next);
    if (result === "error") {
      toast.error("Could not save appearance");
      return;
    }
    toast.success("Appearance updated");
  }

  return (
    <div className="settings-sections">
      <header className="page-head">
        <div>
          <h1 className="page-title">Appearance</h1>
          <p className="page-sub">Choose Light, Dark, or match the system. Saved to your account and cached locally.</p>
        </div>
      </header>

      <section className="settings-section" aria-labelledby="settings-theme">
        <h2 id="settings-theme">Theme</h2>
        <div className="settings-choice-list" role="radiogroup" aria-label="Theme">
          {OPTIONS.map((option) => {
            const selected = preference === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`settings-choice settings-choice-block${selected ? " active" : ""}`}
                onClick={() => void handleSelect(option.value)}
              >
                <span className="settings-choice-label">{option.label}</span>
                <span className="settings-choice-desc">{option.description}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
