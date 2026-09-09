
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Users,
  Zap,
} from "lucide-react";
import { DarkCanvas, Eyebrow, SiteFooter, SiteHeader } from "@/components/brand";
import { brl } from "@/lib/format";
import { startPlanCheckout } from "@/lib/billing";
import { PLANS, planCapacityLabel } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

export default function PlanosPage() {
  const store = useStore();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const currentPlanId = store.academy.plan as PlanId | undefined;

  async function subscribe(planId: PlanId) {
    if (loadingPlan) return;

    setLoadingPlan(planId);

    try {
      const pay = await startPlanCheckout(planId, {
        email: store.users.find((user) => user.id === store.session?.userId)?.email,
        academyName: store.academy.name,
        academyId: store.academy.id,
      });

      if (pay === "demo") {
        store.changePlan(planId);
        toast.success("Plano atualizado com sucesso na demonstração.");

        if (store.session?.role === "student") {
          router.push("/aluno");
        } else if (store.session) {
          router.push("/academia/configuracoes");
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento.",
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <DarkCanvas>
      <SiteHeader
        variant="page"
        actions={
          <>
            <Link
              href={store.session ? "/academia" : "/"}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/45 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {store.session ? "Voltar ao painel" : "Voltar ao início"}
              </span>
            </Link>
            {!store.session ? (
              <Link
                href="/login"
                className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-black transition hover:border-red-500 hover:bg-red-600"
              >
                Entrar
              </Link>
            ) : null}
          </>
        }
      />

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 text-center lg:px-8 lg:pb-24 lg:pt-28">
        <Eyebrow>Planos JiuPro</Eyebrow>

        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
          A gestão certa para cada fase
          <span className="mt-2 block text-white/35">da sua academia.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
          Uma assinatura por academia, cobrada mensalmente no cartão. Seus alunos continuam pagando as mensalidades diretamente para você.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-medium text-white/40">
          {[
            "Sem taxa de implantação",
            "Alteração de plano quando precisar",
            "Pagamento seguro",
          ].map((benefit) => (
            <span key={benefit} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-red-500" />
              {benefit}
            </span>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const popular = Boolean(plan.popular);
            const loading = loadingPlan === plan.id;
            const current = Boolean(store.session && currentPlanId === plan.id);

            return (
              <article
                key={plan.id}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition duration-300 sm:p-8 ${
                  popular
                    ? "border-red-600 bg-[#111] shadow-[0_30px_80px_rgba(127,29,29,.18)] lg:-translate-y-3"
                    : "border-white/10 bg-white/[0.035] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    popular
                      ? "bg-gradient-to-r from-red-900 via-red-500 to-red-900"
                      : "origin-left scale-x-0 bg-red-600 transition-transform duration-300 group-hover:scale-x-100"
                  }`}
                />

                {popular ? (
                  <div className="absolute right-0 top-0 rounded-bl-2xl bg-red-600 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em]">
                    Recomendado
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      popular
                        ? "bg-red-600 text-white"
                        : "bg-white/[0.06] text-white/55 group-hover:bg-red-600 group-hover:text-white"
                    } transition`}
                  >
                    {popular ? <Zap className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  </span>
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.03em]">{plan.name}</h2>
                    {current ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Plano atual
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="mt-6 min-h-12 text-sm leading-6 text-white/42">
                  {plan.blurb}
                </p>

                {"students" in plan && plan.students ? (
                  <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 text-[11px] font-bold text-white/50">
                    <Users className="h-3.5 w-3.5 text-red-500" />
                    {planCapacityLabel(plan)}
                  </div>
                ) : null}

                <div className="mt-7 flex items-end gap-1.5">
                  <strong className="text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                    {brl(plan.price)}
                  </strong>
                  <span className="pb-1.5 text-xs text-white/30">/mês</span>
                </div>

                <div className="my-7 h-px bg-white/8" />

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                  O que está incluído
                </p>

                <ul className="mt-5 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-5 text-white/65">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {store.session ? (
                    <button
                      type="button"
                      onClick={() => void subscribe(plan.id)}
                      disabled={Boolean(loadingPlan) || current}
                      className={`group/button flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                        popular
                          ? "bg-red-600 text-white shadow-lg shadow-red-950/30 hover:bg-red-500"
                          : "border border-white/15 bg-white/[0.04] text-white hover:border-red-500 hover:bg-red-600"
                      }`}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Iniciando pagamento...
                        </>
                      ) : current ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Plano atual
                        </>
                      ) : (
                        <>
                          Escolher {plan.name}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={`/cadastro?plano=${plan.id}`}
                      className={`group/button flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-red-600/20 ${
                        popular
                          ? "bg-red-600 text-white shadow-lg shadow-red-950/30 hover:bg-red-500"
                          : "border border-white/15 bg-white/[0.04] text-white hover:border-red-500 hover:bg-red-600"
                      }`}
                    >
                      Assinar {plan.name}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.025] p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold">Cobrança simples e transparente</h3>
              <p className="mt-1 text-xs leading-5 text-white/35">
                A assinatura do JiuPro é da academia. As mensalidades dos alunos continuam sendo recebidas diretamente pela sua equipe.
              </p>
            </div>
          </div>
          <div className="mt-5 flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 sm:mt-0">
            <LockKeyhole className="h-4 w-4 text-red-500" />
            Ambiente seguro
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-red-700">
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(135deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%)] [background-size:80px_80px]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:flex-row sm:items-center lg:px-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
              Ainda está em dúvida?
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              Experimente o JiuPro antes de assinar.
            </h2>
          </div>
          <Link
            href="/demo"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-red-700 transition hover:bg-black hover:text-white"
          >
            Abrir demonstração
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter
        links={[
          { href: "/", label: "Início" },
          { href: "/demo", label: "Demonstração" },
          { href: "/login", label: "Entrar" },
        ]}
      />
    </DarkCanvas>
  );
}
