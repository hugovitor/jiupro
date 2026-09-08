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
  const publicUrl =
    health?.url && health.url.startsWith("http")
      ? health.url
      : typeof window !== "undefined"
        ? window.location.origin
        : "";
  const stripeReady = Boolean(health?.payments?.stripe);
  const asaasReady = Boolean(health?.payments?.asaas);

  return (
    <section className="surface p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Produção
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">
        {ready ? "A academia já opera na nuvem" : "Falta ligar a nuvem"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A URL da Vercel já serve. Stripe e Asaas entram depois — agora o
        aluno paga no Pix da casa + WhatsApp.
      </p>
      {publicUrl ? (
        <p className="mt-3 break-all font-mono text-[12px] text-muted-foreground">
          {publicUrl}
          {health?.env && health.env !== "development" ? ` · ${health.env}` : ""}
        </p>
      ) : null}
      <ol className="mt-4 space-y-2 text-sm">
        <li>
          <span className={ready ? "text-foreground" : "text-muted-foreground"}>
            {ready
              ? "1. Nuvem ligada. Cadastro e painel não dependem deste navegador."
              : "1. Ligue o Supabase abaixo. Sem isso a academia some se limpar o browser."}
          </span>
        </li>
        <li>
          <span className="text-foreground">
            2. Cole a chave Pix da academia. Cobrança por WhatsApp já funciona.
          </span>
        </li>
        <li>
          <span className="text-muted-foreground">
            3. Stripe (assinatura JiuPro)
            {stripeReady ? " — já está no servidor." : " — depois, nas variáveis da Vercel."}
            {" "}
            Asaas (Pix do aluno)
            {asaasReady ? " já está no servidor." : " — depois."}
          </span>
        </li>
      </ol>
      {publicUrl ? (
        <div className="mt-4 space-y-1 text-[12px] text-muted-foreground">
          <p>Webhook Stripe: {publicUrl}/api/stripe/webhook</p>
          <p>Webhook Asaas: {publicUrl}/api/asaas/webhook</p>
        </div>
      ) : null}
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
