import { useState } from "react";

interface UseSettingsSaveOptions<T> {
  serverState: T;
  onSave: (draft: T) => Promise<void>;
}

/** Shared save-state machine for settings tabs: saving/saved/error + auto-reset. */
export function useSettingsSave<T>({ serverState, onSave }: UseSettingsSaveOptions<T>) {
  const [draft, setDraft] = useState<T>(serverState);
  const [committed, setCommitted] = useState<T>(serverState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(committed);

  async function save() {
    if (!hasChanges || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await onSave(draft);
      setCommitted(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return { draft, setDraft, saving, saved, error, hasChanges, save };
}
