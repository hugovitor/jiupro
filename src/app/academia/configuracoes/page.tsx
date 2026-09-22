"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InviteInstructorForm } from "@/components/academia/invite-instructor-form";
import { OpenAnotherHouseForm } from "@/components/academia/house-switcher";
import { AlunoAppCard } from "@/components/academia/aluno-app-card";
import { AcademyBrandEditor } from "@/components/academia/brand-editor";
import { FirstLoginHint } from "@/components/first-login-guide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_NAME } from "@/lib/brand";
import {
  CONTRACT_DISCLAIMER,
  defaultEnrollmentContract,
  hasPublishedContract,
} from "@/lib/enrollment-contract";
import { normalizeAcademyHouse } from "@/lib/academy-edit";
import { downloadJson } from "@/lib/lgpd";
import { startPlanCheckout } from "@/lib/billing";
import { brl } from "@/lib/format";
import { signupTrialLabel } from "@/lib/billing-offer";
import { PLANS, planById } from "@/lib/plans";
import { hasFeature, planUsageLabel } from "@/lib/plan-access";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";
import { SUPPORT_PHONE_DISPLAY, prioritySupportHref, supportWhatsAppHref } from "@/lib/support";

function ConfigInner() {
  const store = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const plan = planById(store.academy.plan);
  const [promoCode, setPromoCode] = useState("");
  const appliedCheckout = useRef(false);

  const changePlan = store.changePlan;
  useEffect(() => {
    if (appliedCheckout.current) return;
    if (params.get("assinatura") === "cancelada") {
      appliedCheckout.current = true;
      toast.message("Pagamento cancelado. Cole o código promocional e clique no plano.");
      router.replace("/academia/configuracoes");
      return;
    }
    const paid =
      params.get("assinatura") === "ok" || params.get("checkout") === "success";
    const demoReturn = params.get("checkout") === "demo";
    if (!paid && !demoReturn) return;
    appliedCheckout.current = true;
    if (demoReturn) {
      const p = params.get("plan");
      if (p && PLANS.some((item) => item.id === p)) {
        changePlan(p as PlanId);
        toast.success("Assinatura atualizada na demonstração.");
      }
    } else {
      toast.success("Pagamento confirmado. Recarregando o plano do banco.");
    }
    router.replace("/academia/configuracoes");
  }, [params, changePlan, router]);

  async function subscribe(planId: PlanId) {
    try {
      const pay = await startPlanCheckout(planId, {
        email: store.users.find((u) => u.id === store.session?.userId)?.email,
        academyName: store.academy.name,
        academyId: store.academy.id,
        promoCode,
      });
      if (pay === "demo") {
        if (store.isDemo) {
          store.changePlan(planId);
          toast.success("Plano da demonstração alterado.");
        } else {
          toast.error("O Stripe ainda não está ligado neste ambiente. O plano não muda sozinho.");
        }
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
          Dados da academia, Pix dos alunos e plano do {PRODUCT_NAME}.
        </p>
      </div>

      <AlunoAppCard />

      <AcademyBrandEditor />

      {!store.isDemo ? (
        <section className="surface p-5">
          <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
            Primeira vez
          </p>
          <h2 className="mt-2 text-lg font-black tracking-tight">Assistente de início</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pix da academia, convite do aluno e como roda a chamada. Quem marcou “não mostrar mais”
            só vê de novo por aqui.
          </p>
          <FirstLoginHint className="mt-4" />
        </section>
      ) : null}

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
        <HouseForm />
      </section>

      <PixForm />

      <ContractForm />

      <DueDayForm />

      <InviteInstructorForm />

      <OpenAnotherHouseForm />

      <section className="border border-border bg-card p-5">
        <h2 className="font-medium">Plano {PRODUCT_NAME} · {plan.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {brl(plan.price)}/mês · {planUsageLabel(store.academy, store.students.length)}.
          {signupTrialLabel() ? ` ${signupTrialLabel()}, depois ${brl(plan.price)}/mês.` : null}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {plan.features.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
        {store.academy.plan !== "equipe" && !store.isDemo ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Mural, estoque, financeiro completo, PWA, relatórios e marca no app dependem do plano.
          </p>
        ) : null}
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="promo-code">Código promocional</Label>
          <Input
            id="promo-code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Ex: TATAMEX30"
            autoComplete="off"
          />
        </div>
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
        {store.isDemo ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Na demonstração o plano muda nesta tela, sem recarregar a URL. Os itens com cadeado
            no menu abrem a parede de upgrade.
          </p>
        ) : null}
      </section>

      <DropInFeeForm />

      {!store.isDemo ? (
        <section className="surface p-5 text-sm">
          <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">LGPD</p>
          <h2 className="mt-2 text-lg font-black tracking-tight">Dados da academia</h2>
          <p className="mt-2 text-muted-foreground">
            A academia é a controladora da ficha dos alunos. Exporte a cópia ou peça exclusão no
            servidor.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadJson(
                  `tatamex-${store.academy.slug}-dados.json`,
                  store.exportAcademyData(),
                );
                toast.success("Arquivo baixado. Guarde com cuidado — tem CPF e WhatsApp.");
              }}
            >
              Exportar dados
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={supportWhatsAppHref(
                    `Olá. Sou o responsável pela academia ${store.academy.name} no ${PRODUCT_NAME}. Quero exercer o direito de exclusão (LGPD): apagar a conta e as fichas no servidor.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Pedir exclusão no servidor
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (
                  !window.confirm(
                    "Apaga a academia neste aparelho e sai. A cópia no servidor só some depois do pedido no WhatsApp.",
                  )
                ) {
                  return;
                }
                store.eraseAcademyLocally();
                toast.message("Dados locais apagados.");
                window.location.href = "/";
              }}
            >
              Apagar neste aparelho
            </Button>
          </div>
        </section>
      ) : null}

      <section className="border border-border bg-card p-5 text-sm">
        <h2 className="font-medium">
          {hasFeature(store.academy, "prioritySupport")
            ? "Prioridade no suporte"
            : `Suporte ${PRODUCT_NAME}`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          E-mail de senha esquecida: no Supabase, Authentication → SMTP (Resend). Convite de
          professor não precisa disso — vai no WhatsApp com o link.
        </p>
        <p className="mt-2 text-muted-foreground">
          {hasFeature(store.academy, "prioritySupport")
            ? "Plano Equipe: sua academia entra na frente na fila do WhatsApp."
            : "Plano, cupom, cadastro, acesso ou LGPD: fale no WhatsApp"}{" "}
          <a
            className="font-bold text-red-500 hover:text-red-400"
            href={
              hasFeature(store.academy, "prioritySupport")
                ? prioritySupportHref(store.academy.name)
                : supportWhatsAppHref(`Olá, sou dono de academia no ${PRODUCT_NAME}.`)
            }
            target="_blank"
            rel="noreferrer"
          >
            {SUPPORT_PHONE_DISPLAY}
          </a>
          .
        </p>
      </section>
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

function HouseForm() {
  const store = useStore();
  const [name, setName] = useState(store.academy.name);
  const [city, setCity] = useState(
    store.academy.state ? `${store.academy.city}, ${store.academy.state}` : store.academy.city,
  );
  const [address, setAddress] = useState(store.academy.address);
  const [phone, setPhone] = useState(store.academy.phone);
  const [instagram, setInstagram] = useState(store.academy.instagram);
  const [monthlyGoal, setMonthlyGoal] = useState(
    store.academy.monthlyGoal ? String(store.academy.monthlyGoal) : "",
  );

  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">
        Nome, cidade, WhatsApp da secretaria e a meta que o financeiro usa.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = normalizeAcademyHouse({
            name,
            city,
            address,
            phone,
            instagram,
            monthlyGoal,
          });
          if ("error" in next) {
            toast.error(next.error);
            return;
          }
          store.updateAcademy(next);
          toast.success("Dados da academia salvos.");
        }}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="house-name">Nome</Label>
          <Input id="house-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="house-city">Cidade</Label>
          <Input
            id="house-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Brasília, DF"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="house-phone">WhatsApp da academia</Label>
          <Input
            id="house-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(61) 99999-0000"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="house-address">Endereço</Label>
          <Input
            id="house-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, bairro"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="house-ig">Instagram</Label>
          <Input
            id="house-ig"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@suaequipe"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="house-goal">Meta mensal (R$)</Label>
          <Input
            id="house-goal"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            placeholder="15000"
            inputMode="decimal"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit">Salvar academia</Button>
        </div>
      </form>
    </>
  );
}

function PixForm() {
  const store = useStore();
  const [pixKey, setPixKey] = useState(store.academy.pixKey);
  const [pixName, setPixName] = useState(store.academy.pixName);
  const missing = !store.academy.pixKey.trim();

  return (
    <section
      className={`border bg-card p-5 ${missing ? "border-red-500/40 bg-red-500/5" : "border-border"}`}
    >
      <h2 className="font-medium">Pix da academia</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {missing
          ? "Ainda não tem chave. Sem isso a cobrança no WhatsApp sai vazia."
          : "É a chave que vai na cobrança do WhatsApp para o aluno pagar a mensalidade."}
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
          <Input
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="CPF, e-mail, celular ou aleatória"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nome no comprovante</Label>
          <Input value={pixName} onChange={(e) => setPixName(e.target.value)} />
        </div>
        <Button type="submit">{missing ? "Salvar chave Pix" : "Salvar Pix"}</Button>
      </form>
    </section>
  );
}

function ContractForm() {
  const store = useStore();
  const published = hasPublishedContract(store.academy);
  const [body, setBody] = useState(
    store.academy.contractBody || defaultEnrollmentContract(store.academy.name),
  );

  useEffect(() => {
    if (store.academy.contractBody) setBody(store.academy.contractBody);
  }, [store.academy.contractBody]);

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Contrato de matrícula</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Texto da academia com o aluno — não é o termo do {PRODUCT_NAME}. Quem
        assina é o aluno no perfil, ou o responsável no kids. Mudar o texto sobe
        a versão; quem já tinha aceito precisa aceitar de novo.
      </p>
      {published ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Versão {store.academy.contractVersion} publicada.{" "}
          <Link href="/academia/contratos" className="font-medium text-foreground underline">
            Ver quem falta assinar
          </Link>
          .
        </p>
      ) : (
        <p className="mt-2 text-xs text-amber-400">
          Ainda não publicado. Sem isso o app não pede aceite nem trava presença.
        </p>
      )}
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const result = store.publishEnrollmentContract(body);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Contrato publicado. Quem ainda não assinou vê no perfil.");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="house-contract">Texto</Label>
          <Textarea
            id="house-contract"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-56 font-mono text-sm"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">{CONTRACT_DISCLAIMER}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{published ? "Publicar nova versão" : "Publicar contrato"}</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setBody(defaultEnrollmentContract(store.academy.name))}
          >
            Usar modelo da casa
          </Button>
        </div>
      </form>
    </section>
  );
}

function DueDayForm() {
  const store = useStore();
  const [dueDay, setDueDay] = useState(String(store.academy.dueDay || 10));

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Vencimento da mensalidade</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        No dia {store.academy.dueDay || 10} o pendente vira atraso sozinho. Aí o Zap de cobrança
        usa o texto de atraso.
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const day = Math.min(28, Math.max(1, Number(dueDay) || 10));
          store.updateAcademy({ dueDay: day });
          store.refreshOverdue();
          toast.success(`Vencimento no dia ${day}.`);
        }}
      >
        <div className="space-y-1.5">
          <Label>Dia do mês</Label>
          <Input
            className="w-24"
            inputMode="numeric"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>
        <Button type="submit">Salvar vencimento</Button>
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
