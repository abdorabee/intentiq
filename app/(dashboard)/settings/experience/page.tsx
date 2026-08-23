"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { onboardingResetRedirect } from "@/lib/user-role";

export default function ExperienceSettingsPage() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function restartTour() {
    setRestarting(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_tour_completed: false }),
      });
      if (!response.ok) throw new Error("Failed to restart tour");
      toast.success("Product tour will start on your next visit");
    } catch {
      toast.error("Could not restart the product tour");
    } finally {
      setRestarting(false);
    }
  }

  async function resetOnboarding() {
    setResetting(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: false }),
      });
      if (!response.ok) throw new Error("Failed to reset onboarding");
      setConfirmOpen(false);
      const destination = onboardingResetRedirect(false);
      if (destination) router.push(destination);
    } catch {
      toast.error("Could not reset onboarding");
      setResetting(false);
    }
  }

  return (
    <div className="settings-sections">
      <header className="page-head">
        <div>
          <h1 className="page-title">Experience</h1>
          <p className="page-sub">Replay the product tour or walk through onboarding again.</p>
        </div>
      </header>

      <section className="settings-section" aria-labelledby="settings-tour">
        <h2 id="settings-tour">Product tour</h2>
        <p>Marks the tour as incomplete so it can run again when that guide ships.</p>
        <button
          type="button"
          className="tb-btn outlined"
          onClick={() => void restartTour()}
          disabled={restarting}
        >
          {restarting ? "Restarting…" : "Restart product tour"}
        </button>
      </section>

      <section className="settings-section" aria-labelledby="settings-onboarding">
        <h2 id="settings-onboarding">Onboarding</h2>
        <p>Clears the completed flag and returns you to the selling-profile setup flow. Your current answers stay as a draft.</p>
        <button
          type="button"
          className="tb-btn outlined"
          onClick={() => setConfirmOpen(true)}
        >
          Reset onboarding
        </button>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset onboarding?</DialogTitle>
            <DialogDescription>
              You will leave Settings and go through the setup flow again. Existing selling-profile answers are kept so you can edit them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="tb-btn outlined"
              onClick={() => setConfirmOpen(false)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void resetOnboarding()}
              disabled={resetting}
            >
              {resetting ? "Resetting…" : "Reset and continue"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
