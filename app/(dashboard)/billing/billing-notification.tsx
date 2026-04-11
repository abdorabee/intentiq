"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function BillingNotification() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Your plan has been updated.");
      router.replace("/billing");
    } else if (params.get("topup") === "true") {
      toast.success("Credits added to your account.");
      router.replace("/billing");
    }
  }, [params, router]);

  return null;
}
