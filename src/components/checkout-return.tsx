"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

function ReturnInner() {
  const params = useSearchParams();
  const store = useStore();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const paid =
      params.get("assinatura") === "ok" || params.get("checkout") === "success";
    const demoSignup = params.get("checkout") === "demo" && params.get("guia") === "1";
    const plan = params.get("plan");
    if ((!paid && !demoSignup) || !plan || !PLANS.some((p) => p.id === plan)) return;
    done.current = true;
    store.changePlan(plan as PlanId);
    toast.success(
      demoSignup
        ? "Academia aberta. Vamos deixar a casa pronta."
        : "Pagamento confirmado. Assinatura do TatameX ativa.",
    );
  }, [params, store]);

  return null;
}

export function CheckoutReturn() {
  return (
    <Suspense>
      <ReturnInner />
    </Suspense>
  );
}
