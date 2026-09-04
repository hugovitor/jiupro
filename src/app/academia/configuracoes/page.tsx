"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { PLANS, planById } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function ConfigInner() {
  const store = useStore();
  const params = useSearchParams();
  const plan = planById(store.academy.plan);

  const changePlan = store.changePlan;
  useEffect(() => {
    const checkout = params.get("checkout");
    if (checkout !== "success" && checkout !== "demo") return;
    const p = params.get("plan") as PlanId | null;
    if (p) changePlan(p);
    toast.success("Assinatura atualizada.");
  }, [params, changePlan]);

  async function subscribe(planId: PlanId) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = (await res.json()) as { url?: string; demo?: boolean };
    if (data.demo) {
      store.changePlan(planId);
      toast.success("Plano da demo alterado. Stripe entra quando as chaves existirem.");
      return;
    }
    if (data.url) window.location.assign(data.url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conta da academia, plano e ligações com Supabase / Stripe.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Academia</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Nome</dt>
            <dd>{store.academy.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Cidade</dt>
            <dd>
              {store.academy.city}/{store.academy.state}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Endereço</dt>
            <dd className="text-right">{store.academy.address}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Instagram</dt>
            <dd>{store.academy.instagram}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Plano atual · {plan.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {brl(plan.price)}/mês · {plan.students} alunos
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {PLANS.map((p) => (
            <Button
              key={p.id}
              variant={p.id === store.academy.plan ? "default" : "outline"}
              onClick={() => subscribe(p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">Integrações</h2>
        <p className="mt-2 text-muted-foreground">
          Supabase: {isSupabaseConfigured() ? "conectado" : "modo demo (local)"}
        </p>
        <p className="mt-1 text-muted-foreground">
          Stripe: as chaves no servidor ligam o checkout real. Sem elas, o plano
          muda na demo.
        </p>
        <p className="mt-3 text-muted-foreground">
          Schema SQL em <code>supabase/schema.sql</code>. Variáveis em{" "}
          <code>.env.example</code>.
        </p>
      </section>

      <Button
        variant="outline"
        onClick={() => {
          store.resetDemo();
          toast.message("Demo restaurada.");
        }}
      >
        Restaurar dados de demonstração
      </Button>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <Suspense>
      <ConfigInner />
    </Suspense>
  );
}
