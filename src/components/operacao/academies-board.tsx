"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatDate } from "@/lib/format";
import { studentJoinUrl } from "@/lib/join-code";
import {
  BILLING_LABELS,
  operatorOwnerWhatsApp,
  type OperatorAcademy,
} from "@/lib/operator-hq";
import { operatorHeaders } from "@/lib/operator-client";
import { PLANS } from "@/lib/plans";
import type { BillingStatus, PlanId } from "@/lib/types";

export function OperatorAcademiesBoard({
  email,
  academies,
  onChanged,
}: {
  email?: string;
  academies: OperatorAcademy[];
  onChanged: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanId | "todos">("todos");
  const [billingFilter, setBillingFilter] = useState<BillingStatus | "todos">("todos");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return academies.filter((row) => {
      if (planFilter !== "todos" && row.plan !== planFilter) return false;
      if (billingFilter !== "todos" && row.billingStatus !== billingFilter) return false;
      if (!needle) return true;
      return [
        row.name,
        row.city,
        row.state,
        row.ownerName,
        row.ownerEmail,
        row.phone,
        row.joinCode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [academies, billingFilter, planFilter, query]);

  async function patch(id: string, body: Record<string, unknown>, ok: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/operacao/academies", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await operatorHeaders(email)),
        },
        body: JSON.stringify({ id, ...body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Não atualizou a academia.");
        return;
      }
      toast.success(ok);
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-black">Academias no ar</h2>
      </div>
      <p className="text-sm text-white/45">
        Muda o plano na mão, libera quem pagou no Pix, trava quem cancelou. O painel
        da academia não sobrescreve isso.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar academia, dono, cidade…"
        />
        <NativeSelect
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as PlanId | "todos")}
        >
          <option value="todos">Todos os planos</option>
          {PLANS.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={billingFilter}
          onChange={(e) => setBillingFilter(e.target.value as BillingStatus | "todos")}
        >
          <option value="todos">Toda cobrança</option>
          {Object.entries(BILLING_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] tracking-wide text-white/40 uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Academia</th>
              <th className="px-4 py-3 font-bold">Dono</th>
              <th className="px-4 py-3 font-bold">Uso</th>
              <th className="px-4 py-3 font-bold">Plano</th>
              <th className="px-4 py-3 font-bold">Cobrança</th>
              <th className="px-4 py-3 font-bold" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-white/35" colSpan={6}>
                  Nenhuma academia neste filtro. Cadastro novo aparece aqui depois do
                  banco gravar.
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const phone = row.ownerPhone || row.phone;
                const wa = operatorOwnerWhatsApp(phone, row.name, row.ownerName);
                const join = studentJoinUrl(row.joinCode || row.slug);
                const locked =
                  row.billingStatus === "canceled" ||
                  row.billingStatus === "past_due" ||
                  row.billingStatus === "unpaid" ||
                  row.billingStatus === "none" ||
                  row.billingStatus === "incomplete";
                return (
                  <tr key={row.id} className="border-t border-white/8 align-top">
                    <td className="px-4 py-3">
                      <p className="font-bold">{row.name}</p>
                      <p className="text-[11px] text-white/35">
                        {[row.city, row.state].filter(Boolean).join("/")}
                        {row.joinCode ? ` · ${row.joinCode}` : ""}
                      </p>
                      <p className="text-[11px] text-white/25">
                        Entrou {formatDate(row.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-white/55">
                      <p>{row.ownerName || "—"}</p>
                      <p className="text-[11px] text-white/30">{row.ownerEmail || "sem e-mail"}</p>
                      <p className="text-[11px] text-white/30">{phone || "sem WhatsApp"}</p>
                    </td>
                    <td className="px-4 py-3 text-white/55">
                      <p>
                        {row.activeStudents} ativos
                        {row.students !== row.activeStudents ? ` · ${row.students} fichas` : ""}
                      </p>
                      <p className="text-[11px] text-white/30">{row.staff} na equipe</p>
                    </td>
                    <td className="px-4 py-3">
                      <NativeSelect
                        value={row.plan}
                        disabled={busyId === row.id}
                        onChange={(e) =>
                          void patch(
                            row.id,
                            { plan: e.target.value },
                            `${row.name} no plano ${PLANS.find((p) => p.id === e.target.value)?.name ?? e.target.value}.`,
                          )
                        }
                        className="h-9 w-auto min-w-[8.5rem] text-xs"
                      >
                        {PLANS.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </td>
                    <td className="px-4 py-3 text-white/55">
                      <p>{BILLING_LABELS[row.billingStatus]}</p>
                      <p className="text-[11px] text-white/30">
                        {row.subscribed ? "Stripe ligado" : "Sem cartão"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {wa ? (
                          <Button
                            size="sm"
                            variant="outline"
                            render={<a href={wa} target="_blank" rel="noreferrer" />}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Zap
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(join);
                            toast.success("Link do app copiado.");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          App
                        </Button>
                        {locked ? (
                          <Button
                            size="sm"
                            disabled={busyId === row.id}
                            onClick={() =>
                              void patch(row.id, { grant: true }, `${row.name} liberada no painel.`)
                            }
                          >
                            Liberar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Travar o painel da ${row.name}? Eles não entram até você liberar.`,
                                )
                              ) {
                                return;
                              }
                              void patch(row.id, { lock: true }, `${row.name} travada.`);
                            }}
                          >
                            Travar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
