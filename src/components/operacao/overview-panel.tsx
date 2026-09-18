"use client";

import { ClipboardList, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { gymWhatsAppHref, LEAD_STATUSES } from "@/lib/operator-leads";
import type { OperatorLeadDigest, OperatorStats } from "@/lib/operator-hq";
import { PLANS } from "@/lib/plans";

export function OperatorOverviewPanel({
  stats,
  leads,
  onOpenSection,
}: {
  stats: OperatorStats;
  leads: OperatorLeadDigest;
  onOpenSection: (id: "academias" | "planilha") => void;
}) {
  const cards = [
    { label: "Academias", value: String(stats.academies), hint: "Contas no banco" },
    { label: "Alunos", value: String(stats.students), hint: "Fichas em todas as casas" },
    { label: "Recorrência", value: brl(stats.mrr), hint: "Planos ativos no mês" },
    {
      label: "Atenção",
      value: String(stats.pastDue + leads.followUpsDue.length),
      hint: `${stats.pastDue} atraso · ${leads.followUpsDue.length} retorno`,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-black tracking-wide text-white/35 uppercase">{card.label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight">{card.value}</p>
            <p className="mt-1 text-[11px] text-white/35">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface p-5">
          <h2 className="text-sm font-black">Planos no ar</h2>
          <ul className="mt-4 space-y-3">
            {PLANS.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{plan.name}</span>
                <span className="font-black">{stats.byPlan[plan.id] ?? 0}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-white/35">
            {stats.granted} liberada(s) na mão · {stats.trialing} em trial
          </p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => onOpenSection("academias")}>
            Ver academias
          </Button>
        </article>

        <article className="surface p-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-black">Funil da planilha</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {LEAD_STATUSES.map((status) => (
              <li key={status.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{status.label}</span>
                <span className="font-black">{leads.byStatus[status.id] ?? 0}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-white/35">{leads.total} academia(s) na planilha</p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => onOpenSection("planilha")}>
            Abrir planilha
          </Button>
        </article>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-black">Retornos de hoje</h2>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-white/[0.03] text-[11px] tracking-wide text-white/40 uppercase">
              <tr>
                <th className="px-4 py-3 font-bold">Academia</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Data</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {leads.followUpsDue.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/35" colSpan={4}>
                    Nenhum retorno vencido. Quem tem data na planilha aparece aqui.
                  </td>
                </tr>
              ) : (
                leads.followUpsDue.map((row) => {
                  const wa = gymWhatsAppHref(row.phone, row.academyName);
                  return (
                    <tr key={row.id} className="border-t border-white/8">
                      <td className="px-4 py-3">
                        <p className="font-bold">{row.academyName}</p>
                        <p className="text-[11px] text-white/35">{row.city || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-white/55">
                        {LEAD_STATUSES.find((item) => item.id === row.status)?.label ?? row.status}
                      </td>
                      <td className="px-4 py-3 text-white/55">{row.followUpOn}</td>
                      <td className="px-4 py-3 text-right">
                        {wa ? (
                          <Button
                            size="sm"
                            variant="outline"
                            render={<a href={wa} target="_blank" rel="noreferrer" />}
                          >
                            Zap
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
