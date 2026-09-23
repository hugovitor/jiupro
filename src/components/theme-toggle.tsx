"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const light = mounted && resolvedTheme === "light";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground",
        className,
      )}
      onClick={() => setTheme(light ? "dark" : "light")}
      aria-label={light ? "Usar fundo escuro" : "Usar fundo branco"}
      title={light ? "Fundo escuro" : "Fundo branco"}
    >
      {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
