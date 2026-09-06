"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAsaasBrowserConfig,
  saveAsaasBrowserConfig,
} from "@/lib/asaas/config";

export function AsaasConnect() {
  const [apiKey, setApiKey] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [envConfigured, setEnvConfigured] = useState(false);
  const [environment, setEnvironment] = useState("sandbox");

  useEffect(() => {
    const saved = getAsaasBrowserConfig();
    const timer = window.setTimeout(() => {
      if (saved) {
        setApiKey(saved.apiKey);
        setWebhookToken(saved.webhookToken ?? "");
      }
    }, 0);
    void fetch("/api/asaas/account")
      .then((r) => r.json())
      .then((data: { configured?: boolean; environment?: string }) => {
        setEnvConfigured(Boolean(data.configured));
        if (data.environment) setEnvironment(data.environment);
      })
      .catch(() => undefined);
    return () => window.clearTimeout(timer);
  }, []);

  async function save() {
    setBusy("save");
    try {
      if (!apiKey.trim()) {
        saveAsaasBrowserConfig(null);
        setStatus("Asaas desligado neste navegador. Mensalidade volta para Pix da casa.");
        toast.message("Asaas desligado.");
        return;
      }
      if (!apiKey.startsWith("$aact_")) {
        toast.error("A chave começa com $aact_hmlg_ no sandbox.");
        return;
      }
      saveAsaasBrowserConfig({
        apiKey: apiKey.trim(),
        webhookToken: webhookToken.trim() || undefined,
      });
      setStatus("Chave salva neste navegador. Teste a conta sandbox.");
      toast.success("Asaas ligado.");
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    try {
      const res = await fetch("/api/asaas/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() || undefined }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        name?: string;
        environment?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? "Não conectou.");
        toast.error(data.error ?? "Não conectou.");
        return;
      }
      setEnvironment(data.environment ?? "sandbox");
      setStatus(
        `Conta ${data.environment === "production" ? "produção" : "sandbox"}: ${data.name ?? "Asaas"}.`,
      );
      toast.success("Asaas respondendo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Asaas · mensalidades (sandbox)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Gera Pix dinâmico por aluno na conta sandbox. Stripe continua só no
        plano do JiuPro. Produção entra depois, com chave{" "}
        <span className="font-mono text-xs">$aact_prod_</span> e{" "}
        <span className="font-mono text-xs">ASAAS_ENV=production</span>.
      </p>
      {envConfigured && (
        <p className="mt-2 text-sm text-muted-foreground">
          Já existe <code>ASAAS_API_KEY</code> no servidor ({environment}). A
          chave abaixo só entra se o .env estiver vazio.
        </p>
      )}
      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="asaas-key">API key sandbox</Label>
          <Input
            id="asaas-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="$aact_hmlg_…"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asaas-wh">Token do webhook (opcional)</Label>
          <Input
            id="asaas-wh"
            type="password"
            value={webhookToken}
            onChange={(e) => setWebhookToken(e.target.value)}
            placeholder="mesmo authToken do painel Asaas"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Integrações → API Key em{" "}
          <a
            className="underline"
            href="https://sandbox.asaas.com"
            target="_blank"
            rel="noreferrer"
          >
            sandbox.asaas.com
          </a>
          . Webhook: <code>POST /api/asaas/webhook</code> com eventos
          PAYMENT_RECEIVED e PAYMENT_CONFIRMED. Header{" "}
          <code>asaas-access-token</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy !== null}>
            {busy === "save" ? "Salvando…" : "Salvar chave"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void test()}
          >
            {busy === "test" ? "Testando…" : "Testar sandbox"}
          </Button>
        </div>
      </form>
      {status && <p className="mt-3 text-sm">{status}</p>}
    </section>
  );
}
