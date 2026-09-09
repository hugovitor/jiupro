import Link from "next/link";
import { DarkCanvas, Wordmark } from "@/components/brand";

export function AuthScreen({
  kicker,
  title,
  subtitle,
  switchHref,
  switchLabel,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  subtitle: string;
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  return (
    <DarkCanvas>
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Wordmark href="/" />
        <Link
          href={switchHref}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <span className="hidden sm:inline">{switchLabel}</span>
          <span className="sm:hidden">Voltar</span>
        </Link>
      </header>
      <div className="mx-auto w-full max-w-[520px] px-5 pb-16">
        <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
          {kicker}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/45">{subtitle}</p>
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#101010]/95 shadow-[0_35px_100px_rgba(0,0,0,.55)]">
          <div className="h-1 w-full bg-gradient-to-r from-red-800 via-red-500 to-red-800" />
          <div className="p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </DarkCanvas>
  );
}
