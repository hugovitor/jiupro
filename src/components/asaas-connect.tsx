"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { asaasWebhookUrl, isLocalOrigin, publicAppUrl } from "@/lib/app-url";
import {
  getAsaasBrowserConfig,
  saveAsaasBrowserConfig,
} from "@/lib/asaas/config";

export function AsaasConnect() {
  const [apiKey, setApiKey] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [environment, setEnvironment] = useState("sandbox");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    const saved = getAsaasBrowserConfig();
    const timer = window.setTimeout(() => {
      if (saved) {
        setApiKey(saved.apiKey);
        setWebhookToken(saved.webhookToken ?? "");
      }
      setWebhookUrl(
        isLocalOrigin(publicAppUrl())
          ? `${window.location.origin}/api/asaas/webhook`
          : asaasWebhookUrl(),
      );
    }, 0);
    void fetch("/api/asaas/account")
      .then((r) => r.json())
      .then((data: { configured?: boolean; environment?: string }) => {
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
        setStatus("Asaas desligado neste navegador. Mensalidade volta para Pix da academia.");
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
      <h2 className="font-medium">Mensalidade dos alunos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A cobrança sai no WhatsApp com a chave Pix da academia. QR automático
        (Asaas) entra depois, se você quiser — não é obrigatório para operar.
      </p>
      {process.env.NODE_ENV === "production" ? null : (
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
          <Label htmlFor="asaas-wh">Token de autenticação</Label>
          <Input
            id="asaas-wh"
            type="password"
            value={webhookToken}
            onChange={(e) => setWebhookToken(e.target.value)}
            placeholder="o mesmo do painel Asaas"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const bytes = new Uint8Array(24);
              crypto.getRandomValues(bytes);
              const token = `tatamex_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
              setWebhookToken(token);
              toast.message("Cole este token também no Asaas.");
            }}
          >
            Gerar token
          </Button>
        </div>
        {webhookUrl && (
          <div className="space-y-1.5">
            <Label htmlFor="asaas-url">URL do Webhook</Label>
            <Input id="asaas-url" readOnly value={webhookUrl} />
            <p className="text-xs text-muted-foreground">
              Cole no painel Asaas. Tem de ser HTTPS público —{" "}
              <code>127.0.0.1</code> e Preview local o Asaas não alcança.
              Sem domínio ainda, use <strong className="font-medium text-foreground">Conferir</strong>{" "}
              na cobrança.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(webhookUrl);
                toast.success("URL copiada.");
              }}
            >
              Copiar URL
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          No formulário Asaas: nome <strong className="font-medium text-foreground">TatameXWebhooks</strong>
          {" "}(se já existia JiuProWebhooks, pode manter), versão <strong className="font-medium text-foreground">v3</strong>, envio{" "}
          <strong className="font-medium text-foreground">Sequencial</strong>. Eventos:{" "}
          PAYMENT_RECEIVED e PAYMENT_CONFIRMED. O header que o Asaas manda é{" "}
          <code>asaas-access-token</code> (é o token acima). Integrações → API
          Key em{" "}
          <a
            className="underline"
            href="https://sandbox.asaas.com"
            target="_blank"
            rel="noreferrer"
          >
            sandbox.asaas.com
          </a>
          .
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
      )}
      {status && <p className="mt-3 text-sm">{status}</p>}
    </section>
  );
}
