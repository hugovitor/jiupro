import Link from "next/link";
import { DarkCanvas, SiteFooter, SiteHeader } from "@/components/brand";
import { ANPD_URL, CONTROLLER_EMAIL, CONTROLLER_NAME, PRODUCT_NAME } from "@/lib/brand";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

export default function PrivacidadePage() {
  return (
    <DarkCanvas className="min-h-screen">
      <SiteHeader variant="page" />
      <article className="mx-auto max-w-2xl px-5 py-16 text-sm leading-7 text-white/55">
        <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
          LGPD · Lei 13.709/2018
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
          Política de privacidade
        </h1>
        <p className="mt-2 text-xs text-white/35">Atualizada em 9 de setembro de 2026.</p>

        <h2 className="mt-10 text-base font-black text-white">Quem trata o quê</h2>
        <p className="mt-3">
          A academia é a <strong className="text-white/80">controladora</strong> dos dados dos
          alunos (ficha, presença, faixa, mensalidade, CPF, WhatsApp, responsável no kids). O{" "}
          {PRODUCT_NAME} é <strong className="text-white/80">operador</strong> desses dados: guarda
          e processa só para a casa operar.
        </p>
        <p className="mt-3">
          Da conta do dono (e-mail, senha, plano, Pix da casa), o controlador é {CONTROLLER_NAME} (
          {CONTROLLER_EMAIL}), encarregado pelos canais abaixo até nomear outro.
        </p>

        <h2 className="mt-10 text-base font-black text-white">O que coletamos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Dono e professores: nome, e-mail, telefone, senha (hash no Auth).</li>
          <li>
            Alunos: nome, e-mail, WhatsApp, data de nascimento, faixa, presença, mensalidade, CPF
            (só se a casa gerar Pix Asaas), responsável no kids.
          </li>
          <li>Operação: turmas, estoque, mural, eventos — ligados à academia, não a outras casas.</li>
          <li>
            Neste aparelho: sessão e cópia local da academia (localStorage), para o painel abrir
            offline. Sem cookie de anúncio, sem pixel de rede social.
          </li>
        </ul>

        <h2 className="mt-10 text-base font-black text-white">Por que (base legal)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Execução de contrato: assinatura da academia e uso do app do aluno.</li>
          <li>Consentimento: cadastro marcado nos Termos; dados de menor (art. 14) com responsável.</li>
          <li>Legítimo interesse: segurança da conta, isolamento entre academias, suporte.</li>
          <li>Obrigação legal: quando o pagamento (Stripe/Asaas) exigir identificação.</li>
        </ul>

        <h2 className="mt-10 text-base font-black text-white">Crianças e adolescentes</h2>
        <p className="mt-3">
          Turma kids exige o nome do responsável. O tratamento de menor depende do consentimento de
          pelo menos um responsável, em atendimento ao art. 14 da LGPD. CPF no kids deve ser o do
          pagador (responsável), não o da criança.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Com quem compartilhamos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Supabase: autenticação e banco da academia (pode haver transferência internacional).</li>
          <li>Stripe: só a assinatura do {PRODUCT_NAME}, não a mensalidade do aluno.</li>
          <li>Asaas: só se a casa ligar a chave e gerar Pix — aí vai CPF do pagador.</li>
          <li>
            WhatsApp: a mensagem sai do número da academia ou do suporte. O {PRODUCT_NAME} não
            dispara marketing em massa.
          </li>
        </ul>
        <p className="mt-3">
          Não vendemos lista de aluno. Não misturamos uma casa com outra.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Seus direitos (art. 18)</h2>
        <p className="mt-3">
          Confirmar, acessar, corrigir, anonimizar, portar e apagar. No app: exportar JSON em
          Configurações (dono) ou Perfil (aluno); apagar ficha; encerrar a casa neste aparelho.
          Exclusão no servidor: WhatsApp do encarregado. Resposta em até 15 dias.
        </p>
        <p className="mt-3">
          Reclamação à ANPD:{" "}
          <a className="font-bold text-red-400 hover:text-red-300" href={ANPD_URL} target="_blank" rel="noreferrer">
            gov.br/anpd
          </a>
          .
        </p>

        <h2 className="mt-10 text-base font-black text-white">Retenção</h2>
        <p className="mt-3">
          Enquanto a academia usar o produto. Depois do pedido de exclusão, apagamos a conta e as
          fichas no que estiver sob nosso controle. Cópias de backup de provedor seguem o ciclo
          deles, por pouco tempo. Demonstração da Equipe Origem usa dados fictícios.
        </p>

        <h2 className="mt-10 text-base font-black text-white">Encarregado</h2>
        <p className="mt-3">
          {CONTROLLER_NAME} · {CONTROLLER_EMAIL} · WhatsApp{" "}
          <a
            className="font-bold text-red-400 hover:text-red-300"
            href={supportWhatsAppHref(
              `Olá, preciso falar sobre os dados da minha academia no ${PRODUCT_NAME} (LGPD).`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            {SUPPORT_PHONE_DISPLAY}
          </a>
          .
        </p>

        <Link href="/termos" className="mt-10 mr-6 inline-block font-bold text-white">
          Termos de uso
        </Link>
        <Link href="/" className="mt-10 inline-block font-bold text-white">
          Voltar ao início
        </Link>
      </article>
      <SiteFooter />
    </DarkCanvas>
  );
}
