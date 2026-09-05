"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

export default function PlanosPage() {
  const store = useStore();
  const router = useRouter();

  async function subscribe(planId: PlanId) {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as { url?: string; demo?: boolean };
      if (data.demo) {
        store.changePlan(planId);
        toast.success("Plano atualizado na demo (Stripe ainda não configurado).");
        if (store.session?.role === "student") router.push("/aluno");
        else if (store.session) router.push("/academia/configuracoes");
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      toast.error("Não foi possível iniciar o pagamento.");
    } catch {
      toast.error("Falha ao falar com o Stripe.");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <Logo />
          </Link>
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Entrar
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <h1 className="font-display text-4xl">Planos mensais</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Uma assinatura por academia. Alunos não pagam o JiuPro — pagam a
          mensalidade para você.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col border p-6 ${
                plan.popular ? "border-primary" : "border-border"
              }`}
            >
              <h2 className="font-display text-2xl">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
              <p className="mt-4 font-display text-3xl">
                {brl(plan.price)}
                <span className="text-sm font-sans font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f}>— {f}</li>
                ))}
              </ul>
              <Button
                className="mt-6"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => subscribe(plan.id)}
              >
                Assinar {plan.name}
              </Button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
