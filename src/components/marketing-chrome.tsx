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
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border border-white/10 bg-[#09090b]/80 px-3 pl-4 shadow-[0_8px_40px_rgb(0_0_0_/_0.45)] backdrop-blur-md">
          <Link href="/" aria-label="JiuPro">
            <Logo />
          </Link>
          {nav}
          {action ?? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Entrar
              </Button>
              <Button size="sm" render={<Link href="/cadastro" />}>
                Abrir academia
              </Button>
            </div>
          )}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
