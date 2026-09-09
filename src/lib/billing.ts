"use client";

import type { PlanId } from "@/lib/types";

export async function startPlanCheckout(
  planId: PlanId,
  extra?: {
    email?: string;
    academyName?: string;
    academyId?: string;
    promoCode?: string;
    offer?: "signup" | "change";
  },
) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, ...extra }),
  });
  const data = (await res.json()) as {
    url?: string;
    demo?: boolean;
    error?: string;
  };
  if (data.url) {
    window.location.assign(data.url);
    return "redirect" as const;
  }
  if (data.demo) return "demo" as const;
  throw new Error(data.error || "Não foi possível iniciar o pagamento.");
}
