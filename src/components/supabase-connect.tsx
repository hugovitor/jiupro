"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { configSource, saveSupabasePublicConfig } from "@/lib/supabase/config";
import { isDirectSupabaseDbHost } from "@/lib/supabase/database-url";
import { testSupabaseConnection } from "@/lib/supabase/sync";
import { useStore } from "@/lib/store";

type Busy = "save" | "test" | "push" | "pull" | "copy" | "sql" | "apply" | null;

export function SupabaseConnect() {
  const store = useStore();
  const fromEnv = configSource() === "env";
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [dbUrl, setDbUrl] = useState("");
  const [sql, setSql] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [needsSchema, setNeedsSchema] = useState(false);

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
        toast.error("Cole a Project URL e a anon public key.");
        return;
      }
      saveSupabasePublicConfig({ url: url.trim(), anonKey: anonKey.trim() });
      setStatus("Chaves salvas. O projeto vazio ainda precisa do schema (passo 2).");
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
        setNeedsSchema(false);
        setStatus("Pronto: API e tabelas respondendo.");
        toast.success("Supabase configurado.");
        return;
      }
      setNeedsSchema(Boolean(result.needsSchema));
      setStatus(result.error);
      if (result.needsSchema) {
        await loadSql();
        toast.message("Projeto alcançado, ainda vazio. Aplique o schema abaixo.");
      } else {
        toast.error(result.error);
      }
    } finally {
      setBusy(null);
    }
  }

  async function loadSql() {
    if (sql) return sql;
    const res = await fetch("/api/schema");
    if (!res.ok) {
      toast.error("Não deu para ler o schema.");
      return "";
    }
    const text = await res.text();
    setSql(text);
    return text;
  }

  async function copySchema() {
    setBusy("copy");
    try {
      const text = (await loadSql()) || sql;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      toast.success("SQL copiado. Cole no SQL Editor e clique Run.");
    } catch {
      toast.error("A cópia foi bloqueada. Selecione o SQL na caixa e copie.");
    } finally {
      setBusy(null);
    }
  }

  async function showSql() {
    setBusy("sql");
    try {
      await loadSql();
    } finally {
      setBusy(null);
    }
  }

  async function applySchema() {
    setBusy("apply");
    try {
      if (isDirectSupabaseDbHost(dbUrl.trim())) {
        setStatus("URI Direct: convertendo para o pooler IPv4…");
      }
      const res = await fetch("/api/supabase/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl: dbUrl.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? "Não aplicou o schema.");
        toast.error(data.error ?? "Não aplicou o schema.");
        await loadSql();
        return;
      }
      setDbUrl("");
      setNeedsSchema(false);
      setStatus("Tabelas criadas no projeto vazio. Clique em Testar conexão.");
      toast.success("Schema aplicado.");
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
      <h2 className="font-medium">Nuvem · projeto vazio</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Um projeto novo no Supabase não tem tabela nenhuma — isso é esperado. O
        JiuPro cria as tabelas, o Auth e o isolamento por academia. A chave
        pública é a <strong className="font-medium text-foreground">anon</strong>
        ; nunca cole a service role neste formulário.
      </p>

      <ol className="mt-5 space-y-6">
        <li className="space-y-3">
          <p className="text-sm font-medium">1. Ligar o projeto</p>
          <p className="text-sm text-muted-foreground">
            Dashboard → Project Settings → API: Project URL e anon public.
          </p>
          {fromEnv ? (
            <p className="text-sm text-muted-foreground">
              URL e anon key já vêm de <code>NEXT_PUBLIC_SUPABASE_*</code>.
            </p>
          ) : (
            <form
              className="grid gap-3"
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
                  {busy === "save" ? "Salvando…" : "Salvar chaves"}
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
          {fromEnv && (
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void test()}
            >
              {busy === "test" ? "Testando…" : "Testar conexão"}
            </Button>
          )}
        </li>

        <li className="space-y-3">
          <p className="text-sm font-medium">2. Criar as tabelas</p>
          <p className="text-sm text-muted-foreground">
            O caminho que sempre funciona: copie o SQL, cole no SQL Editor do
            projeto e clique{" "}
            <strong className="font-medium text-foreground">Run</strong>. A
            porta 5432 daqui não alcança o host Direct (IPv6).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy !== null}
              onClick={() => void copySchema()}
            >
              {busy === "copy" ? "Copiando…" : "Copiar SQL"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void showSql()}
            >
              {busy === "sql" ? "Carregando…" : "Mostrar SQL"}
            </Button>
            <Button
              variant="outline"
              render={
                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Abrir SQL Editor
            </Button>
          </div>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void applySchema();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="sb-db">URI do banco (opcional)</Label>
              <Input
                id="sb-db"
                type="password"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="postgresql://postgres:…@db.xxxx.supabase.co:5432/postgres"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Direct ou Session pooler. Direct é convertido para IPv4. A URI
                não fica salva neste navegador.
              </p>
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={busy !== null || !dbUrl.trim()}
            >
              {busy === "apply" ? "Criando tabelas…" : "Aplicar schema pela URI"}
            </Button>
          </form>
          {sql ? (
            <Textarea
              value={sql}
              readOnly
              className="min-h-48 font-mono text-xs"
              aria-label="Schema SQL do JiuPro"
            />
          ) : needsSchema ? (
            <p className="text-sm text-muted-foreground">
              O projeto foi alcançado, mas ainda não tem as tabelas. Mostre ou
              copie o SQL e rode uma vez.
            </p>
          ) : null}
        </li>

        <li className="space-y-3">
          <p className="text-sm font-medium">3. Auth e a sua academia</p>
          <p className="text-sm text-muted-foreground">
            Authentication → Sign In / Providers → Email: desligue{" "}
            <strong className="font-medium text-foreground">Confirm email</strong>{" "}
            para entrar na hora. Depois cadastre a academia neste app e use
            Enviar esta academia — a Equipe Origem não sobe.
          </p>
          {!store.isDemo && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy !== null} onClick={() => void push()}>
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
            </div>
          )}
          {store.isDemo && (
            <p className="text-sm text-muted-foreground">
              Você está na demo.{" "}
              <a href="/cadastro" className="text-foreground underline">
                Abra a sua academia
              </a>{" "}
              e volte aqui para enviar os dados.
            </p>
          )}
        </li>
      </ol>

      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}
