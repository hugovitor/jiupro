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
  const [email, setEmail] = useState("carla@origem.jj");
  const [password, setPassword] = useState("demo");

  function enter(nextEmail = email) {
    const ok = store.login(nextEmail);
    if (!ok) {
      toast.error("Conta não encontrada nesta academia.");
      return;
    }
    const role =
      DEMO_ACCOUNTS.find((a) => a.email === nextEmail)?.role ?? "owner";
    toast.success("Bem-vindo ao tatame.");
    router.push(role === "student" ? "/aluno" : "/academia");
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
          Demo da Equipe Origem. Senha de qualquer conta:{" "}
          <span className="text-foreground">demo</span>
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password !== "demo") {
              toast.error("Na demo, a senha é demo.");
              return;
            }
            enter();
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
          <Button type="submit" className="w-full" size="lg">
            Entrar
          </Button>
        </form>

        <div className="mt-8 space-y-2">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Atalhos da demo
          </p>
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                enter(a.email);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-muted/40"
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
