"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startPlanCheckout } from "@/lib/billing";
import { brl } from "@/lib/format";
import { PLANS, planById } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

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
    try {
      const pay = await startPlanCheckout(planId, {
        email: store.users.find((u) => u.id === store.session?.userId)?.email,
        academyName: store.academy.name,
        academyId: store.academy.id,
      });
      if (pay === "demo") {
        store.changePlan(planId);
        toast.success("Plano da demonstração alterado.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível abrir o pagamento.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados da casa, Pix dos alunos e plano do JiuPro.
        </p>
      </div>

      {store.isDemo && (
        <section className="surface p-5">
          <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
            Demonstração
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            A Equipe Origem é só para conhecer o painel.{" "}
            <Link href="/cadastro" className="font-bold text-red-500 hover:text-red-400">
              Abra a sua academia
            </Link>
            .
          </p>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={() => {
              store.resetDemo();
              toast.message("Dados da demonstração restaurados.");
            }}
          >
            Restaurar dados
          </Button>
        </section>
      )}

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

      <PixForm />

      <section className="border border-border bg-card p-5">
        <h2 className="font-medium">Plano JiuPro · {plan.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {brl(plan.price)}/mês · {plan.students} alunos. Se o cadastro parou no
          cartão, escolha o plano de novo — o cupom entra na tela do Stripe.
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

      <DropInFeeForm />
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
        <h2 className="font-medium">Pix da academia</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          É a chave que vai na cobrança do WhatsApp para o aluno pagar a mensalidade.
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
