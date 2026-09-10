import Link from "next/link";
import { DarkCanvas, SiteFooter, SiteHeader } from "@/components/brand";
import { CONTROLLER_EMAIL, CONTROLLER_NAME, PRODUCT_NAME } from "@/lib/brand";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

export default function TermosPage() {
  return (
    <DarkCanvas className="min-h-screen">
      <SiteHeader variant="page" />
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-white/55">
        <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
          {PRODUCT_NAME}
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
          Termos de uso
        </h1>
        <p className="mt-2 text-xs text-white/35">Atualizados em 9 de setembro de 2026.</p>

        <h2 className="mt-10 text-base font-black text-white">O serviço</h2>
        <p className="mt-3">
          O {PRODUCT_NAME} é gestão para academias de Jiu-Jitsu: alunos, presença, faixa, Pix da
          academia e estoque. A academia assina o plano. Os alunos pagam a mensalidade no Pix da
          própria academia — isso não passa no cartão do {PRODUCT_NAME}.
        </p>
        <p className="mt-3">
          Cada academia tem a sua conta. A demonstração da Equipe Origem não mistura com a sua
          operação.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Conta e responsabilidades</h2>
        <p className="mt-3">
          O dono responde pelo cadastro dos alunos, pelo consentimento do responsável no kids e
          pelas mensagens de WhatsApp que a academia dispara. O {PRODUCT_NAME} não usa a lista de
          alunos para vender para terceiros.
        </p>
        <p className="mt-3">
          O aluno entra só com o código da academia. Um e-mail não troca de academia. E-mail de dono
          ou professor não vira app de aluno.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Dados e LGPD</h2>
        <p className="mt-3">
          O tratamento de dados pessoais segue a{" "}
          <Link href="/privacidade" className="font-bold text-white underline underline-offset-2">
            Política de privacidade
          </Link>
          . A academia é controladora da ficha do aluno; o {PRODUCT_NAME} opera esses dados para a
          academia. Titular pode exportar, corrigir e pedir exclusão.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Pagamento e cancelamento</h2>
        <p className="mt-3">
          A assinatura pode ser cancelada no Stripe. O período de teste, quando anunciado, vale
          para academia nova no cadastro. Cupom específico substitui o teste. Encerrar a academia no
          app apaga a cópia neste aparelho; a exclusão no servidor pede o canal de suporte.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Uso aceitável</h2>
        <p className="mt-3">
          Não cadastre aluno em academia alheia, não use CPF de terceiro sem autorização e não
          trate dado de menor sem responsável. Indisponibilidade pontual pode acontecer; recarregue
          e, se persistir, fale no WhatsApp.
        </p>

        <p className="mt-8">
          Foro: Brasília/DF. Operador: {CONTROLLER_NAME} · {CONTROLLER_EMAIL}. Dúvidas: WhatsApp{" "}
          <a
            className="font-bold text-red-400 hover:text-red-300"
            href={supportWhatsAppHref(`Olá, vim pelos termos do ${PRODUCT_NAME}.`)}
            target="_blank"
            rel="noreferrer"
          >
            {SUPPORT_PHONE_DISPLAY}
          </a>
          .
        </p>

        <Link href="/privacidade" className="mt-10 mr-6 inline-block font-bold text-white">
          Privacidade
        </Link>
        <Link href="/" className="mt-10 inline-block font-bold text-white">
          Voltar ao início
        </Link>
      </article>
      <SiteFooter />
    </DarkCanvas>
  );
}
