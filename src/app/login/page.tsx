"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const store = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function enter(nextEmail = email, nextPassword = password) {
    setBusy(true);
    const result = await store.login(nextEmail, nextPassword);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.push(result.role === "student" ? "/aluno" : "/academia");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <h1 className="font-display text-3xl">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use o e-mail da sua academia. A Equipe Origem (demo) está nos atalhos
          abaixo — senha <span className="text-foreground">demo</span>.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void enter();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="mt-8 space-y-2">
          <p className="text-xs text-muted-foreground">Atalhos da demo</p>
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(a.password);
                void enter(a.email, a.password);
              }}
              className="flex w-full items-center justify-between border border-border bg-card px-4 py-3 text-left hover:bg-muted/40"
            >
              <span>
                <span className="block text-sm font-medium">{a.label}</span>
                <span className="text-xs text-muted-foreground">{a.hint}</span>
              </span>
              <span className="text-xs text-primary">Abrir</span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ainda não tem academia?{" "}
          <Link href="/cadastro" className="text-foreground underline">
            Criar conta
          </Link>
        </p>
      </main>
    </div>
  );
}
