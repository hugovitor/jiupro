import Link from "next/link";
import { Home } from "lucide-react";
import { DarkCanvas, Eyebrow, Wordmark } from "@/components/brand";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

export default function NotFound() {
  return (
    <DarkCanvas className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-7xl items-center px-5 lg:px-8">
        <Wordmark href="/" />
      </header>
      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-24 text-center">
        <Eyebrow>Página não encontrada</Eyebrow>
        <p className="mt-8 text-7xl font-black tracking-[-0.06em] text-red-600">404</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          Esse tatame ainda não existe.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/45">
          O endereço não faz parte do TatameX. Volte ao início ou entre na sua
          academia.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-black text-white hover:bg-red-500"
          >
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-bold hover:bg-white/[0.08]"
          >
            Entrar
          </Link>
        </div>
        <a
          href={supportWhatsAppHref()}
          target="_blank"
          rel="noreferrer"
          className="mt-6 text-xs font-bold text-white/35 hover:text-white"
        >
          Suporte {SUPPORT_PHONE_DISPLAY}
        </a>
      </section>
    </DarkCanvas>
  );
}
