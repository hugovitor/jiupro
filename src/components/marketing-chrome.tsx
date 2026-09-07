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
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
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
                Começar
              </Button>
            </div>
          )}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
