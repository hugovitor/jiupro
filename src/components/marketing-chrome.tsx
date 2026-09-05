import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function MarketingChrome({
  children,
  action,
  nav,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  nav?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <div className="hidden w-2 shrink-0 bg-primary sm:block" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/" aria-label="JiuPro">
              <Logo />
            </Link>
            {nav}
            {action ?? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Entrar
                </Button>
                <Button size="sm" render={<Link href="/cadastro" />}>
                  Abrir minha academia
                </Button>
              </div>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

