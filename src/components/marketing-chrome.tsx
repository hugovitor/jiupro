import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function MarketingChrome({
  children,
  action,
  nav,
  dark,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  nav?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <header
        className={
          dark
            ? "sticky top-0 z-30 bg-[#111]"
            : "sticky top-0 z-30 border-b border-border bg-white"
        }
      >
        <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between gap-4 px-5 md:grid md:grid-cols-[1fr_auto_1fr]">
          <Link href="/" aria-label="JiuPro" className="justify-self-start">
            <Logo inverted={dark} />
          </Link>
          <div className={dark ? "hidden text-white/70 md:block" : "hidden md:block"}>{nav}</div>
          <div className="justify-self-end">
            {action ?? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={dark ? "text-white hover:bg-white/10 hover:text-white" : ""}
                  render={<Link href="/login" />}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  className={
                    dark
                      ? "bg-white text-[#111] hover:bg-white/90"
                      : ""
                  }
                  render={<Link href="/cadastro" />}
                >
                  Começar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
