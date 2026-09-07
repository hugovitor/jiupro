"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

type Health = {
  persistence?: "supabase" | "browser";
  payments?: { asaas?: boolean; stripe?: boolean };
};

export function GoLiveCard() {
  const store = useStore();
  const [health, setHealth] = useState<Health | null>(null);
  const cloud = isSupabaseConfigured();

  useEffect(() => {
    void fetch("/api/health")
      .then((r) => r.json())
      .then((data: Health) => setHealth(data))
      .catch(() => undefined);
  }, []);

  const envCloud = health?.persistence === "supabase";
  const ready = cloud || envCloud;

  return (
    <section className="border border-primary/40 bg-primary/5 p-5">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Produção
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">A academia já opera</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Asaas e Stripe entram depois. Agora o que importa: a casa no ar, os
        alunos no painel e a mensalidade no Pix da casa + WhatsApp.
      </p>
      <ol className="mt-4 space-y-2 text-sm">
        <li>
          <span className={ready ? "text-foreground" : "text-primary"}>
            {ready ? "1. Nuvem ligada." : "1. Ligue o Supabase abaixo — sem isso os dados ficam só neste navegador."}
          </span>
        </li>
        <li>
          <span className="text-foreground">
            2. Cole a chave Pix da academia. Cobrança por WhatsApp já funciona.
          </span>
        </li>
        <li>
          <span className="text-muted-foreground">
            3. Asaas (Pix dinâmico) e Stripe (plano JiuPro) — depois.
            {health?.payments?.asaas ? " Asaas já está no servidor." : ""}
            {health?.payments?.stripe ? " Stripe já está no servidor." : ""}
          </span>
        </li>
      </ol>
      {store.isDemo && (
        <p className="mt-4 text-sm text-muted-foreground">
          Você está na Equipe Origem (demo).{" "}
          <Link href="/cadastro" className="text-foreground underline">
            Abra a sua academia
          </Link>{" "}
          para operar de verdade.
        </p>
      )}
    </section>
  );
}
