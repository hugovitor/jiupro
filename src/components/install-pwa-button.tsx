"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { hasFeature } from "@/lib/plan-access";
import { useStore } from "@/lib/store";

type InstallPrompt = Event & { prompt: () => Promise<void> };

export function InstallPwaButton({ className }: { className?: string }) {
  const store = useStore();
  const allowed = hasFeature(store.academy, "pwa");
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (!allowed) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [allowed]);

  if (!allowed || !promptEvent) return null;

  return (
    <Button
      variant="outline"
      className={className}
      onClick={async () => {
        await promptEvent.prompt();
        setPromptEvent(null);
        toast.success("Siga o pedido do navegador para instalar.");
      }}
    >
      Instalar app da academia
    </Button>
  );
}
