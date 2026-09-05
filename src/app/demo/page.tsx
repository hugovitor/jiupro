"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
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
    <div className="flex min-h-full items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">
        {asStudent ? "Entrando como João, faixa azul." : "Entrando na Equipe Origem."}
      </p>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense>
      <DemoGate />
    </Suspense>
  );
}
