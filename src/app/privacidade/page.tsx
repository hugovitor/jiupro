import Link from "next/link";
import { DarkCanvas, SiteFooter, SiteHeader } from "@/components/brand";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

export default function PrivacidadePage() {
  return (
    <DarkCanvas className="min-h-screen">
      <SiteHeader variant="page" />
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-white/55">
        <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
          JiuPro
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
          Privacidade
        </h1>
        <p className="mt-6">
          Guardamos o necessário para a academia operar: dono, alunos, turmas,
          presença, cobranças e estoque. Esses dados servem a essa casa, não a
          outras academias.
        </p>
        <p className="mt-4">
          Pagamento da assinatura JiuPro passa pela Stripe. Mensalidade do aluno
          não transita no cartão do JiuPro — vai no Pix da academia.
        </p>
        <p className="mt-4">
          Para ver, corrigir ou apagar dados da sua casa, fale no WhatsApp{" "}
          <a
            className="font-bold text-red-400 hover:text-red-300"
            href={supportWhatsAppHref("Olá, preciso falar sobre os dados da minha academia no JiuPro.")}
            target="_blank"
            rel="noreferrer"
          >
            {SUPPORT_PHONE_DISPLAY}
          </a>
          .
        </p>
        <Link href="/" className="mt-10 inline-block font-bold text-white">
          Voltar ao início
        </Link>
      </article>
      <SiteFooter />
    </DarkCanvas>
  );
}
