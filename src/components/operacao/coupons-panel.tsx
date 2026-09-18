"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { OperatorPromo } from "@/lib/operator-hq";
import { operatorHeaders } from "@/lib/operator-client";

type Kind = "month_free" | "percent_once" | "percent_forever";

export function OperatorCouponsPanel({
  email,
  stripe,
  trialLabel,
  codes,
  onChanged,
}: {
  email?: string;
  stripe: boolean;
  trialLabel: string | null;
  codes: OperatorPromo[];
  onChanged: () => Promise<void>;
}) {
  const [grantEmail, setGrantEmail] = useState("");
  const [kind, setKind] = useState<Kind>("month_free");
  const [percent, setPercent] = useState("20");
  const [note, setNote] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const data = (await res.json()) as { ok?: boolean; code?: string; error?: string };
      if (!res.ok || !data.code) {
        toast.error(data.error ?? "Não criou o cupom.");
        return;
      }
      setLastCode(data.code);
      toast.success(`Cupom ${data.code} criado.`);
      setGrantEmail("");
      setNote("");
      await onChanged();
    } finally {
      setBusy(false);
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
    await onChanged();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface p-5">
          <h2 className="text-sm font-black">O que o cliente paga ao TatameX</h2>
          <p className="mt-3 text-sm leading-6 text-white/50">
            No cadastro a academia é criada na hora. Em seguida o Stripe cobra o
            plano Essencial, Academia ou Equipe no cartão. Academia nova ganha{" "}
            <strong className="text-white">{trialLabel ?? "30 dias grátis"}</strong>,
            com cartão cadastrado; a primeira fatura cai depois.
          </p>
          {!stripe ? (
            <p className="mt-3 text-sm text-amber-400">
              Stripe ainda não está neste deploy. Cupom só funciona depois da chave.
            </p>
          ) : null}
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
          pessoa. O código também pode ser enviado no WhatsApp.
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
            <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              <option value="month_free">Primeiro mês grátis</option>
              <option value="percent_once">% só no primeiro mês</option>
              <option value="percent_forever">% enquanto a assinatura durar</option>
            </NativeSelect>
          </div>
          {kind !== "month_free" ? (
            <div className="space-y-1.5">
              <Label>Percentual</Label>
              <Input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" />
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
        <Button className="mt-4" disabled={busy || !stripe} onClick={() => void createGrant()}>
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
              {codes.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/35" colSpan={5}>
                    Nenhum cupom ativo. Crie o primeiro acima.
                  </td>
                </tr>
              ) : (
                codes.map((row) => (
                  <tr key={row.id} className="border-t border-white/8">
                    <td className="px-4 py-3 font-mono font-bold">{row.code}</td>
                    <td className="px-4 py-3 text-white/55">
                      {row.email || "qualquer cadastro com o código"}
                      {row.note ? (
                        <span className="mt-0.5 block text-[11px] text-white/30">{row.note}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-white/55">{row.summary}</td>
                    <td className="px-4 py-3 text-white/55">
                      {row.timesRedeemed}
                      {row.maxRedemptions ? ` / ${row.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => void deactivate(row.id)}>
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
    </div>
  );
}
