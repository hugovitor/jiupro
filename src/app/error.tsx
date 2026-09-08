"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-[12px] tracking-[0.18em] text-muted-foreground uppercase">
        JiuPro
      </p>
      <h1 className="text-[22px] font-medium">Algo falhou nesta página.</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tente de novo. Se continuar, recarregue ou entre outra vez.
      </p>
      <Button onClick={() => reset()}>Tentar de novo</Button>
    </div>
  );
}
