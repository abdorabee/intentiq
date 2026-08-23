"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  selectableRoles,
  USER_ROLE_LABELS,
} from "@/lib/user-role";
import type { UserRole } from "@/lib/types";

export function AccountRoleEditor() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { role?: UserRole } | null) => {
        setRole(data?.role ?? "sdr");
      })
      .catch(() => setRole("sdr"));
  }, []);

  async function handleChange(next: UserRole) {
    if (!role || next === role || saving) return;
    if (next === "admin") return;
    const previous = role;
    setRole(next);
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!response.ok) {
        throw new Error("Failed to update role");
      }
      toast.success("Role updated");
    } catch {
      setRole(previous);
      toast.error("Could not update role");
    } finally {
      setSaving(false);
    }
  }

  const options = selectableRoles(role);

  return (
    <fieldset className="settings-role" disabled={saving || role === null}>
      <legend className="sr-only">Workspace role</legend>
      <div className="settings-choice-list" role="radiogroup" aria-label="Workspace role">
        {options.map((option) => {
          const selected = role === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`settings-choice${selected ? " active" : ""}`}
              onClick={() => handleChange(option)}
            >
              {USER_ROLE_LABELS[option]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
