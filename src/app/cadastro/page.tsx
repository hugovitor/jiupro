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
  const [plan, setPlan] = useState<PlanId>(
    PLANS.some((p) => p.id === preset) ? preset : "academia",
  );

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
        <h1 className="font-display text-3xl">Abrir academia</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Na demo, o cadastro entra na Equipe Origem para você ver o produto
          cheio. Com Supabase ligado, cada academia vira uma conta isolada.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !academy.trim()) {
              toast.error("Preencha o seu nome e o da academia.");
              return;
            }
            store.changePlan(plan);
            store.login("carla@origem.jj");
            toast.success(`${academy} pronta. Entrando no painel.`);
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
            <Label>Plano</Label>
            <div className="grid gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
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
          <Button type="submit" className="w-full" size="lg">
            Criar e entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-foreground underline">
            Entrar
          </Link>
        </p>
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
