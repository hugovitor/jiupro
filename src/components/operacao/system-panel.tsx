"use client";

import { toast } from "sonner";
import { Activity, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { healthGaps, type OperatorHealth } from "@/lib/operator-hq";
import { operatorHeaders } from "@/lib/operator-client";
import { RESET_CONFIRMATION } from "@/lib/reset-confirm";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { wipeLocalAcademies } from "@/lib/vault";
import { useState } from "react";

const CHECKS: Array<{ key: keyof Omit<OperatorHealth, "env">; label: string; ok: string; miss: string }> = [
  {
    key: "supabase",
    label: "Banco (URL + anon)",
    ok: "Academias e alunos gravam neste deploy.",
    miss: "Sem isso o produto fica só no navegador.",
  },
  {
    key: "serviceRole",
    label: "Service role",
    ok: "Esta central lê todas as academias.",
    miss: "Cole SUPABASE_SERVICE_ROLE_KEY na Vercel.",
  },
  {
    key: "stripe",
    label: "Stripe",
    ok: "Plano do TatameX pode ser cobrado no cartão.",
    miss: "Você ainda libera o plano na mão e cobra no Pix.",
  },
  {
    key: "redis",
    label: "Redis (cadastro)",
    ok: "Limite de cadastro vale em todas as instâncias.",
    miss: "Sem Redis o limite só vale nesta instância.",
  },
];

export function OperatorSystemPanel({
  email,
  health,
}: {
  email?: string;
  health: OperatorHealth;
}) {
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const gaps = healthGaps(health);

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

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-black">O que está ligado neste deploy</h2>
        </div>
        <p className="mt-2 text-sm text-white/45">
          Ambiente: {health.env === "production" ? "produção" : health.env === "preview" ? "preview" : "local"}.
          {gaps.length ? ` Falta: ${gaps.join(", ")}.` : " Tudo que a operação precisa está no ar."}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CHECKS.map((item) => {
            const on = Boolean(health[item.key]);
            return (
              <article key={item.key} className="surface p-5">
                <p className="text-[10px] font-black tracking-wide text-white/35 uppercase">
                  {on ? "Ligado" : "Falta"}
                </p>
                <h3 className="mt-1 text-sm font-black">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{on ? item.ok : item.miss}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/schema", {
                credentials: "include",
                headers: await operatorHeaders(email),
              });
              const sql = await res.text();
              if (!res.ok) {
                toast.error(sql || "Não baixou o schema.");
                return;
              }
              const url = URL.createObjectURL(new Blob([sql], { type: "text/plain;charset=utf-8" }));
              window.open(url, "_blank", "noopener");
            }}
          >
            Abrir schema.sql
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/schema", {
                credentials: "include",
                headers: await operatorHeaders(email),
              });
              const sql = await res.text();
              if (!res.ok) {
                toast.error(sql || "Não baixou o schema.");
                return;
              }
              await navigator.clipboard.writeText(sql);
              toast.success("SQL copiado. Cole no SQL Editor do projeto.");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar schema
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-600/30 bg-red-600/10 p-5">
        <h2 className="text-sm font-black text-red-400">Começar o teste do zero</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
          Apaga academias, alunos, fichas e logins de teste no servidor. A sua conta da
          operação ({email}) permanece para você cadastrar de novo. Também limpa este
          navegador.
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
  );
}
