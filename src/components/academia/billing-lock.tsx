"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startPlanCheckout } from "@/lib/billing";
import { academyNeedsPayment, billingLockCopy } from "@/lib/billing-status";
import { useStore } from "@/lib/store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureBrowserAuthSession } from "@/lib/supabase/session";

export function BillingLock({ stripeLive }: { stripeLive: boolean }) {
  const store = useStore();
  const [busy, setBusy] = useState(false);
  if (!academyNeedsPayment(store.academy, stripeLive)) return null;
  if (store.session?.role === "student") return null;

  const copy = billingLockCopy(store.academy.billingStatus);

  async function pay() {
    if (busy) return;
    setBusy(true);
    try {
      if (
        store.academy.stripeCustomerId &&
        (store.academy.billingStatus === "past_due" || store.academy.billingStatus === "unpaid")
      ) {
        const client = createSupabaseBrowserClient();
        const token = client ? await ensureBrowserAuthSession(client) : null;
        if (token) {
          const res = await fetch("/api/stripe/portal", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
          if (data.url) {
            window.location.assign(data.url);
            return;
          }
        }
      }
      const pay = await startPlanCheckout(store.academy.plan || "academia", {
        email: store.users.find((user) => user.id === store.session?.userId)?.email,
        academyName: store.academy.name,
        academyId: store.academy.id,
        offer: store.academy.stripeSubscriptionId ? "change" : "signup",
      });
      if (pay === "demo") {
        toast.message("Neste ambiente o Stripe não está ligado. O painel segue aberto.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não abriu o pagamento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0c0c0c] p-6 sm:rounded-3xl">
        <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">TatameX</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">{copy.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button className="h-12" disabled={busy} onClick={() => void pay()}>
            {busy ? "Abrindo…" : copy.action}
          </Button>
          <Button variant="outline" render={<Link href="/academia/configuracoes" />}>
            Configurações e cupom
          </Button>
        </div>
      </div>
    </div>
  );
}
