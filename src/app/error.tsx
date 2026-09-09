
"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Home,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Erro capturado pelo JiuPro:", error);
  }, [error]);

  function reloadPage() {
    window.location.reload();
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#070707] text-white selection:bg-red-600 selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(220,38,38,0.18),transparent_32%),radial-gradient(circle_at_15%_85%,rgba(255,255,255,0.05),transparent_25%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="pointer-events-none absolute -right-52 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-red-600/15" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full border border-white/5" />

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <BeltMark />
            <div>
              <span className="block text-lg font-black tracking-[-0.04em]">
                JIUPRO
              </span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.32em] text-white/35">
                Gestão no tatame
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao início</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-5 pb-16 pt-28 lg:px-8">
        <div className="w-full max-w-2xl text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/10 shadow-[0_20px_60px_rgba(127,29,29,.25)]">
              <ShieldAlert className="h-9 w-9 text-red-500" />
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Erro inesperado
          </div>

          <h1 className="mt-7 text-4xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl">
            Algo saiu do controle.
            <span className="mt-2 block text-white/35">
              Vamos colocar você de volta no tatame.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-white/45 sm:text-base">
            Não foi possível concluir esta ação. Tente carregar novamente. Se o problema continuar, atualize a página ou retorne ao início.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-600/25"
            >
              <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
              Tentar novamente
            </button>

            <button
              type="button"
              onClick={reloadPage}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-white/10"
            >
              <RefreshCcw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
              Recarregar página
            </button>
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Ir para a página inicial
          </Link>

          {error.digest ? (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                Código para suporte
              </p>
              <code className="mt-2 block break-all font-mono text-xs text-red-400">
                {error.digest}
              </code>
            </div>
          ) : null}

          <div className="mx-auto mt-10 flex max-w-md items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/20">
            <span className="h-px flex-1 bg-white/8" />
            Seus dados permanecem protegidos
            <span className="h-px flex-1 bg-white/8" />
          </div>
        </div>
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-20 hidden sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 text-[10px] text-white/20 lg:px-8">
          <span>© 2026 JiuPro</span>
          <span>Gestão para academias de Jiu-Jitsu.</span>
        </div>
      </footer>
    </main>
  );
}

function BeltMark() {
  return (
    <span className="relative block h-7 w-11 overflow-hidden rounded-sm bg-[#191919] shadow-inner shadow-black">
      <span className="absolute inset-y-0 right-0 w-3.5 bg-red-600" />
      <span className="absolute right-1 top-1 h-5 w-[2px] bg-white" />
    </span>
  );
}
