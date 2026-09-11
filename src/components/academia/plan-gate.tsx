"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FEATURE_UPSELL,
  hasFeature,
  type PlanFeature,
} from "@/lib/plan-access";
import { planById } from "@/lib/plans";
import { useStore } from "@/lib/store";

export function UpgradeWall({ feature }: { feature: PlanFeature }) {
  const store = useStore();
  const copy = FEATURE_UPSELL[feature];
  const target = planById(copy.plan);
  const current = planById(store.academy.plan);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="surface p-6 sm:p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-red-600 text-white">
          <Lock className="size-5" />
        </span>
        <p className="mt-4 text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
          Plano {target.name}
        </p>
        <h1 className="mt-2 font-display text-3xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.body}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Você está no {current.name}. Primeiro mês grátis, depois {target.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/planos" />}>Ver planos</Button>
          <Button variant="outline" render={<Link href="/academia/configuracoes" />}>
            Trocar nas configurações
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PlanGate({
  feature,
  children,
}: {
  feature: PlanFeature;
  children: React.ReactNode;
}) {
  const store = useStore();

  if (!store.hydrated) {
    return <p className="text-sm text-muted-foreground">Carregando o plano…</p>;
  }
  if (!hasFeature(store.academy, feature)) {
    return <UpgradeWall feature={feature} />;
  }
  return children;
}
