"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Copy,
  LoaderCircle,
  TicketPercent,
} from "lucide-react";
import { DarkCanvas, Eyebrow, Wordmark } from "@/components/brand";
import { OperatorLeadsBoard } from "@/components/operacao/leads-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isOperatorEmail } from "@/lib/operator";
import { operatorHeaders } from "@/lib/operator-client";
import { RESET_CONFIRMATION } from "@/lib/reset-confirm";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { wipeLocalAcademies } from "@/lib/vault";

type Kind = "month_free" | "percent_once" | "percent_forever";

type Overview = {
  operator: string;
  trialDays: number;
  trialLabel: string | null;
  stripe: boolean;
  codes: Array<{
    id: string;
    code: string;
    email: string;
    note: string;
    kind: string;
    summary: string;
    timesRedeemed: number;
    maxRedemptions: number | null;
  }>;
  academies: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    planLabel: string;
    ownerEmail: string;
    ownerName: string;
    subscribed: boolean;
    createdAt: string;
  }>;
};

export default function OperacaoPage() {
  const store = useStore();
  const router = useRouter();
  const storeEmail = store.users.find((user) => user.id === store.session?.userId)?.email;
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const email = storeEmail || authEmail || undefined;
  const allowed = isOperatorEmail(email);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [grantEmail, setGrantEmail] = useState("");
  const [kind, setKind] = useState<Kind>("month_free");
  const [percent, setPercent] = useState("20");
  const [note, setNote] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operacao", {
        credentials: "include",
        headers: await operatorHeaders(email),
      });
      const data = (await res.json()) as Overview & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não carregou o painel.");
        setOverview(null);
        return;
      }
      setOverview(data);
    } catch {
      setError("Não carregou o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (storeEmail) {
      setAuthEmail(storeEmail);
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email?.trim().toLowerCase() ?? null);
    });
  }, [storeEmail]);

  useEffect(() => {
    if (!store.session) {
      router.replace("/login?next=/operacao");
      return;
    }
    if (!allowed) {
      setLoading(false);
      return;
    }
    void load();
  }, [allowed, router, store.session]);

  async function createGrant() {
    setBusy(true);
    try {
      const res = await fetch("/api/operacao/grants", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await operatorHeaders(email)),
        },
        body: JSON.stringify({
          email: grantEmail,
          kind,
          percent: Number(percent),
          note,
          maxRedemptions: Number(maxRedemptions),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        summary?: string;
      };
      if (!res.ok || !data.code) {
        toast.error(data.error ?? "Não criou o cupom.");
        return;
      }
      setLastCode(data.code);
      toast.success(`Cupom ${data.code} criado.`);
      setGrantEmail("");
      setNote("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function resetDatabase() {
    if (resetConfirm.trim().toUpperCase() !== RESET_CONFIRMATION) {
      toast.error(`Digite ${RESET_CONFIRMATION} para confirmar.`);
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/operacao/reset", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await operatorHeaders(email)),
        },
        body: JSON.stringify({ confirm: RESET_CONFIRMATION }),
      });
      const data = (await res.json()) as {
        error?: string;
        academies?: number;
        students?: number;
        users?: number;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Não limpou o banco.");
        return;
      }
      wipeLocalAcademies();
      await createSupabaseBrowserClient()?.auth.signOut();
      toast.success(
        `Banco limpo: ${data.academies ?? 0} academia(s), ${data.students ?? 0} aluno(s), ${data.users ?? 0} login(s) de teste.`,
      );
      window.location.href = "/cadastro";
    } finally {
      setResetting(false);
    }
  }

  async function deactivate(id: string) {
    const res = await fetch("/api/operacao/grants", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(await operatorHeaders(email)),
      },
      body: JSON.stringify({ id }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Não desligou o cupom.");
      return;
    }
    toast.message("Cupom desligado.");
    await load();
  }

  if (!store.session) {
    return (
      <DarkCanvas className="flex min-h-screen items-center justify-center text-sm text-white/40">
        Abrindo painel…
      </DarkCanvas>
    );
  }

  if (!allowed) {
    return (
      <DarkCanvas className="flex min-h-screen flex-col items-center justify-center px-5">
        <Wordmark href="/" />
        <p className="mt-8 max-w-md text-center text-sm text-white/50">
          Este painel é do dono do TatameX, não da academia. Entre com o e-mail da
          operação.
        </p>
        <Link href="/academia" className="mt-6 text-sm font-bold text-red-500">
          Voltar à academia
        </Link>
      </DarkCanvas>
    );
  }

  return (
    <DarkCanvas className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Wordmark href="/" kicker={false} />
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/academia"
              className="inline-flex items-center gap-2 text-white/45 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Academia
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-5 py-10">
        <div>
          <Eyebrow>Operação TatameX</Eyebrow>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Planilha, cupons e academias.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Saiu do Maps, entra aqui. Cupom para gente específica. Quem já abriu
            conta no produto. Sua academia de teste continua no painel.
          </p>
        </div>

            <OperatorLeadsBoard email={email} />

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="surface p-5">
            <h2 className="text-sm font-black">O que o cliente paga ao TatameX</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              No cadastro a academia é criada na hora. Em seguida o Stripe cobra o
              plano Essencial, Academia ou Equipe no cartão. Academia nova ganha{" "}
              <strong className="text-white">
                {overview?.trialLabel ?? "30 dias grátis"}
              </strong>
              , com cartão cadastrado; a primeira fatura cai depois. Troca de plano
              na conta já ativa não ganha mês grátis de novo.
            </p>
          </article>
          <article className="surface p-5">
            <h2 className="text-sm font-black">O que o aluno paga à academia</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Mensalidade, aula avulsa e loja saem no Pix da academia, via WhatsApp.
              Isso não passa no Stripe do TatameX. Cupom daqui não altera a
              mensalidade do aluno.
            </p>
          </article>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <TicketPercent className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-black">Dar cupom para alguém</h2>
          </div>
          <p className="mt-2 text-sm text-white/45">
            Se preencher o e-mail, o desconto entra sozinho no cadastro dessa
            pessoa. O código também pode ser enviado no WhatsApp. Um cupom por
            e-mail; uso limitado.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>E-mail da pessoa</Label>
              <Input
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="ana@academia.com.br"
                type="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as Kind)}
                className="h-9 w-full rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white"
              >
                <option value="month_free">Primeiro mês grátis</option>
                <option value="percent_once">% só no primeiro mês</option>
                <option value="percent_forever">% enquanto a assinatura durar</option>
              </select>
            </div>
            {kind !== "month_free" ? (
              <div className="space-y-1.5">
                <Label>Percentual</Label>
                <Input
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  inputMode="numeric"
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Quantas pessoas podem usar</Label>
              <Input
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Anotação (só você vê)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Parceiro Campinas, piloto…"
              />
            </div>
          </div>
          <Button className="mt-4" disabled={busy} onClick={() => void createGrant()}>
            {busy ? "Criando…" : "Criar cupom"}
          </Button>
          {lastCode ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
              <p className="font-mono text-lg font-black tracking-wide">{lastCode}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(lastCode);
                  toast.success("Código copiado.");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
          ) : null}
        </section>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-white/40">
            <LoaderCircle className="h-4 w-4 animate-spin text-red-500" />
            Carregando operação…
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <section>
          <h2 className="text-sm font-black">Cupons ativos</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] tracking-wide text-white/40 uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">Código</th>
                  <th className="px-4 py-3 font-bold">Para</th>
                  <th className="px-4 py-3 font-bold">Desconto</th>
                  <th className="px-4 py-3 font-bold">Usos</th>
                  <th className="px-4 py-3 font-bold" />
                </tr>
              </thead>
              <tbody>
                {(overview?.codes ?? []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-white/35" colSpan={5}>
                      Nenhum cupom ativo. Crie o primeiro acima.
                    </td>
                  </tr>
                ) : (
                  overview!.codes.map((row) => (
                    <tr key={row.id} className="border-t border-white/8">
                      <td className="px-4 py-3 font-mono font-bold">{row.code}</td>
                      <td className="px-4 py-3 text-white/55">
                        {row.email || "qualquer cadastro com o código"}
                        {row.note ? (
                          <span className="mt-0.5 block text-[11px] text-white/30">
                            {row.note}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-white/55">{row.summary}</td>
                      <td className="px-4 py-3 text-white/55">
                        {row.timesRedeemed}
                        {row.maxRedemptions ? ` / ${row.maxRedemptions}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void deactivate(row.id)}
                        >
                          Desligar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-black">Academias</h2>
          </div>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] tracking-wide text-white/40 uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">Academia</th>
                  <th className="px-4 py-3 font-bold">Dono</th>
                  <th className="px-4 py-3 font-bold">Plano</th>
                  <th className="px-4 py-3 font-bold">Stripe</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.academies ?? []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-white/35" colSpan={4}>
                      Nenhuma academia no Supabase ainda — ou a service role não
                      está neste deploy.
                    </td>
                  </tr>
                ) : (
                  overview!.academies.map((row) => (
                    <tr key={row.id} className="border-t border-white/8">
                      <td className="px-4 py-3">
                        <p className="font-bold">{row.name}</p>
                        <p className="text-[11px] text-white/35">
                          {[row.city, row.state].filter(Boolean).join("/")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-white/55">
                        {row.ownerName}
                        <span className="mt-0.5 block text-[11px] text-white/30">
                          {row.ownerEmail}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.planLabel}</td>
                      <td className="px-4 py-3 text-white/55">
                        {row.subscribed ? "Assinatura ligada" : "Sem cobrança ainda"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-red-600/30 bg-red-600/10 p-5">
          <h2 className="text-sm font-black text-red-400">Começar o teste do zero</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Apaga academias, alunos, fichas e logins de teste no servidor. A sua conta da
            operação ({email}) permanece para você cadastrar de novo. Também limpa este
            navegador. No celular, saia do app e entre de novo.
          </p>
          <div className="mt-4 max-w-sm space-y-1.5">
            <Label>Digite {RESET_CONFIRMATION}</Label>
            <Input
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder={RESET_CONFIRMATION}
              autoCapitalize="characters"
            />
          </div>
          <Button
            className="mt-4"
            variant="destructive"
            disabled={resetting || resetConfirm.trim().toUpperCase() !== RESET_CONFIRMATION}
            onClick={() => void resetDatabase()}
          >
            {resetting ? "Limpando…" : "Apagar banco e começar de novo"}
          </Button>
        </section>
      </div>
    </DarkCanvas>
  );
}
