"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  configSource,
  saveSupabasePublicConfig,
} from "@/lib/supabase/config";
import { testSupabaseConnection } from "@/lib/supabase/sync";
import { useStore } from "@/lib/store";

export function SupabaseConnect() {
  const store = useStore();
  const fromEnv = configSource() === "env";
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "push" | "pull" | "copy" | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setBusy("save");
    try {
      if (!url.trim() && !anonKey.trim()) {
        saveSupabasePublicConfig(null);
        setStatus("Projeto desconectado. O painel continua neste navegador.");
        toast.message("Supabase desligado.");
        return;
      }
      if (!url.startsWith("http") || anonKey.trim().length < 20) {
        toast.error("Cole a Project URL e a anon public key do Dashboard.");
        return;
      }
      saveSupabasePublicConfig({ url: url.trim(), anonKey: anonKey.trim() });
      setStatus("Chaves salvas neste navegador.");
      toast.success("Projeto ligado.");
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    try {
      const result = await testSupabaseConnection();
      if (result.ok) {
        setStatus("Conexão ok. Schema encontrado.");
        toast.success("Supabase respondeu.");
        return;
      }
      setStatus(result.error);
      toast.error(result.error);
    } finally {
      setBusy(null);
    }
  }

  async function copySchema() {
    setBusy("copy");
    try {
      const res = await fetch("/api/schema");
      if (!res.ok) {
        toast.error("Não deu para ler o schema. Abra supabase/schema.sql no repositório.");
        return;
      }
      const sql = await res.text();
      await navigator.clipboard.writeText(sql);
      toast.success("SQL copiado. Cole no SQL Editor do Supabase.");
    } catch {
      toast.error("O navegador bloqueou a cópia. Abra supabase/schema.sql.");
    } finally {
      setBusy(null);
    }
  }

  async function push() {
    setBusy("push");
    try {
      const result = await store.syncNow();
      if (result.ok) {
        setStatus("Academia gravada nas tabelas do Supabase.");
        toast.success("Enviado.");
        return;
      }
      setStatus(result.error);
      toast.error(result.error);
    } finally {
      setBusy(null);
    }
  }

  async function pull() {
    setBusy("pull");
    try {
      const result = await store.pullNow();
      if (result.ok) {
        setStatus("Painel atualizado com o que está no Supabase.");
        toast.success("Baixado.");
        return;
      }
      setStatus(result.error);
      toast.error(result.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Supabase</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alunos, turmas, caixa, mural e o resto do painel gravam nas tabelas do
        seu projeto — não num JSON único. A chave aqui é a anon public; nunca
        cole a service role. Se já salvou neste navegador, use Testar conexão.
      </p>

      {fromEnv ? (
        <p className="mt-3 text-sm text-muted-foreground">
          URL e anon key vêm de <code>NEXT_PUBLIC_SUPABASE_*</code> no ambiente.
        </p>
      ) : (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="sb-url">Project URL</Label>
            <Input
              id="sb-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sb-anon">anon public key</Label>
            <Input
              id="sb-anon"
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJ…"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy !== null}>
              {busy === "save" ? "Salvando…" : "Salvar projeto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void test()}
            >
              {busy === "test" ? "Testando…" : "Testar conexão"}
            </Button>
          </div>
        </form>
      )}

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          No Dashboard: Project Settings → API. Copie a URL e a chave{" "}
          <strong className="font-medium text-foreground">anon public</strong>.
        </li>
        <li>
          SQL Editor: cole o schema do JiuPro (botão abaixo). Pode rodar de
          novo; o arquivo é idempotente.
        </li>
        <li>
          Auth → Providers → Email: desligue “Confirm email” se quiser entrar na
          hora, sem caixa de confirmação.
        </li>
        <li>
          Cadastro cria a academia no Auth. “Enviar esta academia” sobe o que já
          está neste navegador.
        </li>
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void copySchema()}
        >
          {busy === "copy" ? "Copiando…" : "Copiar schema.sql"}
        </Button>
        {!store.isDemo && (
          <>
            <Button
              type="button"
              disabled={busy !== null}
              onClick={() => void push()}
            >
              {busy === "push" ? "Enviando…" : "Enviar esta academia"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void pull()}
            >
              {busy === "pull" ? "Baixando…" : "Baixar da nuvem"}
            </Button>
          </>
        )}
      </div>

      {store.isDemo && (
        <p className="mt-3 text-sm text-muted-foreground">
          Você está na Equipe Origem. Abra a sua academia (Cadastro) para
          sincronizar dados reais.
        </p>
      )}

      {status && <p className="mt-3 text-sm">{status}</p>}
    </section>
  );
}
