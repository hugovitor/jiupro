"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { DarkCanvas, Wordmark } from "@/components/brand";
import { useStore } from "@/lib/store";

function DemoGate() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const asStudent = params.get("as") === "aluno";

  const login = store.login;

  useEffect(() => {
    const email = asStudent ? "joao@aluno.origem" : "carla@origem.jj";
    void login(email, "demo").then((result) => {
      if (result.ok) router.replace(asStudent ? "/aluno" : "/academia");
      else router.replace("/login");
    });
  }, [asStudent, router, login]);

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
