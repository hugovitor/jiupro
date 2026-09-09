"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

type Health = {
  env?: string;
  url?: string;
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
  const stripeReady = Boolean(health?.payments?.stripe);

  return (
    <section className="surface p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
        Sua conta
      </p>
      <h2 className="mt-2 text-lg font-black tracking-tight">
        {store.isDemo
          ? "Você está na demonstração"
          : ready
            ? "Academia pronta para operar"
            : "Falta gravar a academia"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {store.isDemo
          ? "A Equipe Origem é só para conhecer o painel. Abra a sua casa para cadastrar alunos de verdade."
          : ready
            ? stripeReady
              ? "Os dados ficam na sua conta. A assinatura do Ponteira é no cartão; a mensalidade do aluno, no Pix da academia."
              : "Os dados ficam na sua conta. A mensalidade do aluno entra pelo Pix da academia."
            : "Cadastre pelo site publicado para não perder a academia se limpar o celular."}
      </p>
      {store.isDemo && (
        <p className="mt-4 text-sm">
          <Link href="/cadastro" className="font-bold text-red-500 hover:text-red-400">
            Abrir a minha academia
          </Link>
        </p>
      )}
    </section>
  );
}
