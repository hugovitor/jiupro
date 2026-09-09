import Link from "next/link";
import { DarkCanvas, SiteFooter, SiteHeader } from "@/components/brand";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

export default function TermosPage() {
  return (
    <DarkCanvas className="min-h-screen">
      <SiteHeader variant="page" />
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-white/55">
        <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
          JiuPro
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
          Termos de uso
        </h1>
        <p className="mt-6">
          O JiuPro é um sistema de gestão para academias de Jiu-Jitsu. A academia
          assina o plano no cartão. Os alunos pagam a mensalidade no Pix da
          própria casa.
        </p>
        <p className="mt-4">
          Cada academia tem a sua conta. Os dados da casa (alunos, presença,
          financeiro) ficam separados das outras. A demonstração da Equipe Origem
          é só para conhecer o painel e não mistura com a sua operação.
        </p>
        <p className="mt-4">
          A assinatura pode ser cancelada no Stripe. O primeiro mês grátis, quando
          anunciado, vale para academia nova no cadastro. Cupom específico
          substitui o mês grátis.
        </p>
        <p className="mt-4">
          Dúvidas, cancelamento ou problema de acesso: WhatsApp{" "}
          <a
            className="font-bold text-red-400 hover:text-red-300"
            href={supportWhatsAppHref("Olá, vim pelos termos do JiuPro.")}
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
