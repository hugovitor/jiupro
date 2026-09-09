"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { startPlanCheckout } from "@/lib/billing";
import { brl } from "@/lib/format";
import { PLANS, planById, planCapacityLabel } from "@/lib/plans";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60";

function CadastroForm() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const preset = (params.get("plano") as PlanId | null) ?? "academia";
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<PlanId>(
    PLANS.some((p) => p.id === preset) ? preset : "academia",
  );
  const remote = isSupabaseConfigured();

  return (
    <AuthScreen
      kicker="Conta da academia"
      title="Abra a sua casa, isolada da demonstração."
      subtitle={
        remote
          ? "Com o projeto ligado, a conta também fica no Supabase."
          : "Neste navegador, isolada da demo. Na Vercel, ligue o Supabase (Configurações ou variáveis do projeto) para não perder os dados."
      }
      switchHref="/login"
      switchLabel="Já tenho conta"
    >
      <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
        Abrir academia
      </p>
      <p className="mt-3 text-sm leading-6 text-white/45">
        Cadastro cria a sua casa, não entra como Carla. Em seguida você paga a
        assinatura do JiuPro no cartão. Alunos continuam pagando a mensalidade
        no Pix da academia.
      </p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !academy.trim() || !email.trim() || !password) {
            toast.error("Preencha nome, academia, e-mail e senha.");
            return;
          }
          setBusy(true);
          const result = await store.registerAcademy({
            ownerName: name,
            academyName: academy,
            city,
            email,
            password,
            plan,
          });
          if (!result.ok) {
            setBusy(false);
            toast.error(result.error);
            return;
          }
          try {
            const pay = await startPlanCheckout(plan, {
              email,
              academyName: academy,
              academyId: store.academy.id,
            });
            if (pay === "demo") {
              toast.success(
                `${academy.trim()} aberta. Pagamento online liga quando o Stripe estiver na Vercel.`,
              );
              router.push("/academia");
            }
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Casa criada. Não deu para abrir o pagamento.",
            );
            router.push("/academia");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="space-y-2">
          <label htmlFor="name" className="text-xs font-bold text-white/70">
            Seu nome
          </label>
          <input
            id="name"
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Carla Mendes"
            autoComplete="name"
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="academy" className="text-xs font-bold text-white/70">
            Nome da academia
          </label>
          <input
            id="academy"
            className={fieldClass}
            value={academy}
            onChange={(e) => setAcademy(e.target.value)}
            placeholder="Equipe Origem Jiu-Jitsu"
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="city" className="text-xs font-bold text-white/70">
            Cidade
          </label>
          <input
            id="city"
            className={fieldClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Campinas, SP"
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold text-white/70">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@academia.com"
            autoComplete="username"
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold text-white/70">
            Senha
          </label>
          <input
            id="password"
            type="password"
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-white/70">Plano</p>
          <div className="grid gap-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                  plan === p.id
                    ? "border-red-500 bg-red-500/10"
                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-extrabold">{p.name}</span>
                  <span className="text-xs text-white/45">{brl(p.price)}/mês</span>
                </span>
                <span className="mt-1 block text-[11px] text-white/35">
                  {planCapacityLabel(p)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={busy}
        >
          {busy ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Abrindo o pagamento…
            </>
          ) : (
            <>
              Pagar {planById(plan).name} e abrir
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/35">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-extrabold text-white underline decoration-red-600 decoration-2 underline-offset-4 hover:text-red-400"
        >
          Entrar
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-white/30">
        Quer ver o produto cheio?{" "}
        <Link href="/login" className="underline">
          Entre na demo
        </Link>
        .
      </p>
    </AuthScreen>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080808] text-sm text-white/40">
          Carregando cadastro…
        </div>
      }
    >
      <CadastroForm />
    </Suspense>
  );
}
