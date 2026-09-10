"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { startPlanCheckout } from "@/lib/billing";
import { signupTrialDays, signupTrialLabel } from "@/lib/billing-offer";
import { brl } from "@/lib/format";
import { PLANS, planById, planCapacityLabel } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";
import { LgpdConsent } from "@/components/lgpd-consent";
import { PRODUCT_NAME } from "@/lib/brand";
import type { PlanId } from "@/lib/types";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60";

function CadastroForm() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const preset = (params.get("plano") as PlanId | null) ?? "academia";
  const presetCoupon = params.get("cupom")?.trim() ?? "";
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [promoCode, setPromoCode] = useState(presetCoupon);
  const [accepted, setAccepted] = useState(false);
  const [plan, setPlan] = useState<PlanId>(
    PLANS.some((p) => p.id === preset) ? preset : "academia",
  );
  const [showPlans, setShowPlans] = useState(
    Boolean(preset && preset !== "academia" && PLANS.some((p) => p.id === preset)),
  );
  const trialDays = signupTrialDays();
  const trialLabel = signupTrialLabel(trialDays);
  const selected = planById(plan);

  return (
    <AuthScreen
      kicker="Abrir academia"
      title="Cadastre a academia e o dono."
      subtitle={
        trialLabel
          ? `${trialLabel}. Você informa o cartão agora; a cobrança do ${PRODUCT_NAME} começa depois. Alunos pagam no Pix da academia.`
          : `Cria a academia vazia. Em seguida você assina o ${PRODUCT_NAME} no cartão. Alunos pagam no Pix da academia.`
      }
      switchHref="/login"
      switchLabel="Já tenho conta"
    >
      <form
        className="mt-2 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !academy.trim() || !city.trim() || !email.trim() || !password) {
            toast.error("Preencha nome, academia, cidade, e-mail e senha.");
            return;
          }
          if (!accepted) {
            toast.error("Aceite os Termos e a Política de privacidade para continuar.");
            return;
          }
          setBusy(true);
          void fetch("/api/aluno/casa", { method: "POST" }).catch(() => undefined);
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
            if (result.resumed) {
              toast.message("Academia já existia. Abrindo o pagamento.");
            }
            const pay = await startPlanCheckout(plan, {
              email,
              academyName: academy,
              academyId: result.academyId ?? store.academy.id,
              promoCode,
              offer: "signup",
            });
            if (pay === "demo") {
              toast.success(`${academy.trim()} aberta. Vamos deixar a academia pronta.`);
              router.push("/academia?guia=1");
            }
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Academia criada. Não deu para abrir o pagamento da assinatura.",
            );
            router.push("/academia?guia=1");
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
            placeholder="Ana Ribeiro"
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
            placeholder="Nova Equipe Jiu-Jitsu"
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

        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">{selected.name}</p>
              <p className="mt-0.5 text-[11px] text-white/40">
                {brl(selected.price)}/mês · {planCapacityLabel(selected)}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-white/50 underline-offset-4 hover:text-white hover:underline"
              onClick={() => setShowPlans((v) => !v)}
            >
              {showPlans ? "Fechar" : "Trocar plano"}
            </button>
          </div>
          {showPlans ? (
            <div className="mt-3 grid gap-2">
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
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="promo" className="text-xs font-bold text-white/70">
            Código promocional
          </label>
          <input
            id="promo"
            className={fieldClass}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Opcional — o código que você criou, não o ID"
            autoComplete="off"
            disabled={busy}
          />
          <p className="text-[11px] leading-5 text-white/30">
            {trialLabel
              ? "Se preencher, vale o cupom no lugar do mês grátis. No Stripe: Produtos → Cupons → Códigos promocionais."
              : "Opcional. Use o código promocional, não o ID interno do cupom."}
          </p>
        </div>

        <LgpdConsent checked={accepted} onChange={setAccepted} />
        <button
          type="submit"
          className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={busy}
        >
          {busy ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Abrindo sua academia…
            </>
          ) : (
            <>
              {trialLabel ? "Começar grátis" : "Abrir academia"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/35">
        Já tem conta, ou parou no cartão?{" "}
        <Link
          href="/login?next=/academia/configuracoes"
          className="font-extrabold text-white underline decoration-red-600 decoration-2 underline-offset-4 hover:text-red-400"
        >
          Entre e conclua o pagamento
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-white/30">
        Dúvida? WhatsApp{" "}
        <a
          href={supportWhatsAppHref(`Olá, estou abrindo minha academia no ${PRODUCT_NAME}.`)}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          {SUPPORT_PHONE_DISPLAY}
        </a>
      </p>
      <p className="mt-3 text-center text-xs text-white/30">
        Sou aluno?{" "}
        <Link href="/entrar" className="underline">
          Entrar na minha academia
        </Link>
        . Quer só conhecer o sistema?{" "}
        <Link href="/login" className="underline">
          Entre na demonstração
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
