"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl } from "@/lib/format";
import { PLANS, planById } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";
import { AsaasConnect } from "@/components/asaas-connect";
import { SupabaseConnect } from "@/components/supabase-connect";

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
          Projeto Supabase, Pix Asaas (sandbox) e plano Stripe.
        </p>
      </div>

      <section className="border border-border bg-card p-5">
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

      <SupabaseConnect />

      <AsaasConnect />

      <section className="border border-border bg-card p-5">
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

      <PixForm />

      <DropInFeeForm />

      <section className="border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">Stripe</h2>
        <p className="mt-2 text-muted-foreground">
          Conta:{" "}
          {store.isDemo
            ? "Equipe Origem (demonstração)"
            : "sua academia neste navegador"}
        </p>
        <p className="mt-1 text-muted-foreground">
          As chaves no servidor ligam o checkout real. Sem elas, o plano muda só
          neste navegador.
        </p>
      </section>

      {store.isDemo && (
      <Button
        variant="outline"
        onClick={() => {
          store.resetDemo();
          toast.message("Demo restaurada.");
        }}
      >
        Restaurar dados de demonstração
      </Button>
      )}
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

function PixForm() {
  const store = useStore();
  const [pixKey, setPixKey] = useState(store.academy.pixKey);
  const [pixName, setPixName] = useState(store.academy.pixName);

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Pix avulso (fallback)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Entra no WhatsApp se o Asaas não estiver ligado. Com Asaas, a cobrança
        usa QR dinâmico por mensalidade.
      </p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          store.updateAcademy({ pixKey, pixName });
          toast.success("Pix atualizado.");
        }}
      >
        <div className="space-y-1.5">
          <Label>Chave</Label>
          <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Nome no comprovante</Label>
          <Input value={pixName} onChange={(e) => setPixName(e.target.value)} />
        </div>
        <Button type="submit">Salvar Pix</Button>
      </form>
    </section>
  );
}

function DropInFeeForm() {
  const store = useStore();
  const [fee, setFee] = useState(String(store.academy.dropInFee || 40));

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Aula avulsa</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O que o visitante paga na porta.
      </p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          store.updateAcademy({ dropInFee: Number(fee.replace(",", ".")) || 40 });
          toast.success("Taxa de visitante atualizada.");
        }}
      >
        <div className="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input value={fee} onChange={(e) => setFee(e.target.value)} />
        </div>
        <Button type="submit">Salvar taxa</Button>
      </form>
    </section>
  );
}
