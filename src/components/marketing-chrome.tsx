import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DarkCanvas, SiteFooter, SiteHeader, Wordmark } from "@/components/brand";

export function MarketingChrome({
  children,
  action,
  nav,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  nav?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <DarkCanvas className="flex min-h-screen flex-col">
      <SiteHeader
        variant="page"
        nav={nav}
        actions={
          action ?? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao início</span>
            </Link>
          )
        }
      />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </DarkCanvas>
  );
}

export function MarketingLockup() {
  return <Wordmark href="/" />;
}
