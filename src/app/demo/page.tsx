"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { DarkCanvas, Wordmark } from "@/components/brand";
import { useStore } from "@/lib/store";

const OWNER_DEMO_PATHS = new Set([
  "/academia",
  "/academia/alunos",
  "/academia/financeiro",
  "/academia/cobrancas",
  "/academia/presenca",
  "/academia/graduacoes",
  "/academia/estoque",
]);

function demoDestination(asStudent: boolean, next: string | null) {
  if (asStudent) return "/aluno";
  if (next && OWNER_DEMO_PATHS.has(next)) return next;
  return "/academia";
}

function DemoGate() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const asStudent = params.get("as") === "aluno";
  const next = params.get("next");

  const login = store.login;

  useEffect(() => {
    const email = asStudent ? "joao@aluno.origem" : "carla@origem.jj";
    const destination = demoDestination(asStudent, next);
    void login(email, "demo").then((result) => {
      if (result.ok) router.replace(destination);
      else router.replace("/login");
    });
  }, [asStudent, next, router, login]);

  return (
    <DarkCanvas className="flex min-h-screen flex-col items-center justify-center px-5">
      <Wordmark href="/" />
      <div className="mt-10 flex items-center gap-3 text-sm text-white/50">
        <LoaderCircle className="h-4 w-4 animate-spin text-red-500" />
        {asStudent
          ? "Entrando como João, faixa azul."
          : "Entrando na Equipe Origem."}
      </div>
    </DarkCanvas>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080808] text-sm text-white/40">
          Abrindo demonstração…
        </div>
      }
    >
      <DemoGate />
    </Suspense>
  );
}
