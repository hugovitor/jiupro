"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANS } from "@/lib/plans";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

function CadastroForm() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const preset = (params.get("plano") as PlanId | null) ?? "academia";
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<PlanId>(
    PLANS.some((p) => p.id === preset) ? preset : "academia",
  );
  const remote = isSupabaseConfigured();

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-[#080808] p-10 lg:flex">
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <h1 className="font-display text-6xl leading-[0.9] font-semibold uppercase">
            Abre a
            <br />
            sua
            <br />
            <span className="text-primary">casa.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm text-neutral-400">
            {remote
              ? "Isolada da Equipe Origem. Com o projeto ligado, a conta também fica no Supabase."
              : "Neste navegador, isolada da demo. Em produção, ligue o Supabase em Configurações para não perder os dados."}
          </p>
        </div>
        <p className="text-xs text-neutral-600">JiuPro · cada academia, uma conta</p>
        <div className="absolute inset-y-0 right-0 w-2 bg-primary" aria-hidden />
      </aside>
      <main className="flex flex-col">
        <header className="border-b border-border lg:hidden">
          <div className="flex h-14 items-center px-4">
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
          <h2 className="font-display text-3xl uppercase">Abrir academia</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastro cria a sua casa, não entra como Carla. Sem cartão agora —
            o plano é só o teto de alunos.
          </p>
          <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || !academy.trim() || !email.trim() || !password) {
              toast.error("Preencha nome, academia, e-mail e senha.");
              return;
            }
            setBusy(true);
            const result = await store.registerAcademy({
              ownerName: name,
              academyName: academy,
              city,
              email,
              password,
              plan,
            });
            setBusy(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`${academy.trim()} aberta. Cadastre o primeiro aluno.`);
            router.push("/academia");
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Carla Mendes"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="academy">Nome da academia</Label>
            <Input
              id="academy"
              value={academy}
              onChange={(e) => setAcademy(e.target.value)}
              placeholder="Equipe Origem Jiu-Jitsu"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Campinas, SP"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@academia.com"
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
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plano</Label>
            <div className="grid gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`border px-3 py-2 text-left text-sm ${
                    plan === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground"> · R$ {p.price}/mês</span>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Criando a casa…" : "Criar e entrar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-foreground underline">
            Entrar
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Quer ver o produto cheio?{" "}
          <Link href="/login" className="underline">
            Entre na demo
          </Link>
          .
        </p>
        </div>
      </main>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  );
}
