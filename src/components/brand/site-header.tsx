import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";

export function SiteHeader({
  variant = "page",
  nav,
  actions,
}: {
  variant?: "landing" | "page";
  nav?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const landing = variant === "landing";

  return (
    <header
      className={cn(
        "z-50 border-b border-white/10 bg-[#080808]/85 backdrop-blur-xl",
        landing ? "fixed inset-x-0 top-0" : "relative",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Wordmark href="/" />
        {nav ? (
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            {nav}
          </nav>
        ) : null}
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white sm:inline-flex"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
              >
                Começar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
