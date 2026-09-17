"use client";

import type { PlanId } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureBrowserAuthSession } from "@/lib/supabase/session";

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
  const client = createSupabaseBrowserClient();
  const token = client ? await ensureBrowserAuthSession(client) : null;
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ planId, ...extra }),
  });
  const data = (await res.json()) as {
    url?: string;
    demo?: boolean;
    error?: string;
  };
  if (data.demo) return "demo" as const;
  if (data.url) {
    window.location.assign(data.url);
    return "redirect" as const;
  }
  throw new Error(data.error || "Não foi possível iniciar o pagamento.");
}
