import { SUPPORT_PHONE_DISPLAY } from "@/lib/support";
import type { PlanId } from "@/lib/types";

export type ChatAudience = "visitor" | "owner" | "student";

export type ChatContext = {
  audience: ChatAudience;
  academyName?: string;
  plan?: PlanId;
};

export type ChatLink = { href: string; label: string };

export type ChatReply = {
  id: string;
  text: string;
  links?: ChatLink[];
  suggestions?: string[];
  handoff?: boolean;
};

export type KnowledgeEntry = {
  id: string;
  audiences: ChatAudience[] | "all";
  phrases: string[];
  keywords: string[];
  answer: (ctx: ChatContext) => Omit<ChatReply, "id">;
};

function house(ctx: ChatContext) {
  return ctx.academyName?.trim() || "sua academia";
}

function planName(ctx: ChatContext) {
  if (ctx.plan === "essencial") return "Essencial";
  if (ctx.plan === "equipe") return "Equipe";
  if (ctx.plan === "academia") return "Academia";
  return null;
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "planos",
    audiences: "all",
    phrases: [
      "quanto custa",
      "qual o preco",
      "planos",
      "assinatura",
      "mensalidade do tatamex",
      "essencial",
      "plano academia",
      "plano equipe",
      "primeiro mes gratis",
    ],
    keywords: [
      "plano",
      "planos",
      "preco",
      "preço",
      "custa",
      "valor",
      "assinatura",
      "essencial",
      "equipe",
      "gratis",
      "grátis",
    ],
    answer: (ctx) => ({
      text:
        `O TatameX cobra a academia, não o aluno. Essencial R$ 97/mês (até 50 alunos): cadastro, mensalidades, presença e histórico de faixas. Academia R$ 197/mês (até 200): financeiro, estoque, candidatos a graduação, mural e PWA. Equipe R$ 347/mês (ilimitado): relatórios, suporte na frente e a marca da academia no app. Primeiro mês grátis no cadastro.` +
        (planName(ctx)
          ? ` ${house(ctx)} está no ${planName(ctx)}.`
          : ""),
      links: [
        { href: "/planos", label: "Ver planos" },
        { href: "/cadastro", label: "Abrir academia" },
      ],
      suggestions: ["O que o Essencial não tem?", "Como mudar de plano?"],
    }),
  },
  {
    id: "upgrade",
    audiences: "all",
    phrases: [
      "o que o essencial nao tem",
      "mural bloqueado",
      "preciso subir de plano",
      "limite de alunos",
      "trava do plano",
    ],
    keywords: [
      "upgrade",
      "limite",
      "bloqueado",
      "muro",
      "estoque",
      "mural",
      "pwa",
      "relatorio",
      "relatório",
    ],
    answer: (ctx) => ({
      text:
        "O painel esconde o que o plano não inclui. Essencial não tem lançamentos, fechamento, estoque, fila de graduação, mural nem app instalável. Academia não tem relatórios da equipe, marca no app nem prioridade no WhatsApp. Quem estourou o limite de alunos cadastra de novo depois de subir o plano. Fichas que já existem continuam." +
        (planName(ctx) ? ` Agora: ${planName(ctx)}.` : ""),
      links: [{ href: "/academia/configuracoes", label: "Trocar plano" }],
      suggestions: ["Planos e preços", "Como cadastrar aluno"],
    }),
  },
  {
    id: "presenca",
    audiences: "all",
    phrases: [
      "como funciona a presenca",
      "aluno confirma",
      "confirmar aula",
      "nao aparece na chamada",
      "aceitar presenca",
      "nao veio",
      "desistir da aula",
      "check in",
    ],
    keywords: [
      "presenca",
      "presença",
      "chamada",
      "confirmar",
      "aceitar",
      "validar",
      "desistir",
      "faltou",
      "treino",
    ],
    answer: (ctx) => {
      if (ctx.audience === "student") {
        return {
          text: `No app, abra Hoje e toque em Confirmar na turma. Isso ainda não conta como treino: a secretaria de ${house(ctx)} precisa Aceitar. Se mudar de ideia, Desistir tira você da lista. Se o professor marcar Não veio, a falta fica; confirmar de novo abre outra espera.`,
          links: [{ href: "/aluno", label: "Confirmar aula" }],
          suggestions: ["Como vejo minha faixa?", "Como pago a mensalidade?"],
        };
      }
      return {
        text: "O aluno confirma no celular. Enquanto você não aceitar, a linha fica em Aguardando — não soma treino. Aceitar valida e entra no histórico. Não veio marca falta e não volta no atualizar. Se o aluno Desistir, some da Presença. Não fazer nada deixa esperando.",
        links: [{ href: "/academia/presenca", label: "Abrir presença" }],
        suggestions: ["Como o aluno entra no app?", "Turmas e vagas"],
      };
    },
  },
  {
    id: "app-aluno",
    audiences: "all",
    phrases: [
      "como o aluno entra",
      "app do aluno",
      "convidar aluno",
      "cadastrar aluno",
      "codigo da academia",
      "buscar academia",
    ],
    keywords: [
      "app",
      "aluno",
      "convite",
      "entrar",
      "codigo",
      "código",
      "senha",
      "cadastro",
    ],
    answer: (ctx) => ({
      text: `Dois jeitos. Você cadastra a ficha em Alunos e manda o WhatsApp: o aluno confirma ${house(ctx)} e cria a senha. Ou ele abre /entrar, busca o nome da academia e se cadastra — a ficha nasce na sua lista. Cada e-mail fica numa academia só.`,
      links:
        ctx.audience === "student"
          ? [{ href: "/entrar", label: "Entrar na academia" }]
          : [
              { href: "/academia/alunos", label: "Cadastrar aluno" },
              { href: "/entrar", label: "App do aluno" },
            ],
      suggestions: ["Esqueci a senha", "PWA na tela inicial"],
    }),
  },
  {
    id: "cobranca",
    audiences: "all",
    phrases: [
      "como cobrar",
      "mensalidade",
      "pix da academia",
      "aluno pagar",
      "atraso",
    ],
    keywords: ["mensalidade", "cobrar", "pix", "pagamento", "atraso", "fatura", "caixa"],
    answer: (ctx) => {
      if (ctx.audience === "student") {
        return {
          text: `A mensalidade é da ${house(ctx)}, não do TatameX. No Perfil aparece o Pix da academia ou a fatura, se a secretaria gerou. Pague e avise quem cobra aí.`,
          links: [{ href: "/aluno/perfil", label: "Ver Pix" }],
          suggestions: ["Confirmar aula", "Histórico de faixa"],
        };
      }
      return {
        text: "Em Cobranças você manda o WhatsApp com a chave Pix da academia (Configurações). Baixa na mão quando o comprovante chegar. Lançamentos, fechamento e loja entram no plano Academia. O Stripe do site cobra só o TatameX, não o aluno.",
        links: [
          { href: "/academia/cobrancas", label: "Cobranças" },
          { href: "/academia/configuracoes", label: "Pix da academia" },
        ],
        suggestions: ["Financeiro completo", "Planos e preços"],
      };
    },
  },
  {
    id: "faixas",
    audiences: "all",
    phrases: [
      "historico de faixa",
      "graduacao",
      "quando promove",
      "candidatos",
    ],
    keywords: ["faixa", "grau", "graduacao", "graduação", "promocao", "promoção", "ibjjf"],
    answer: (ctx) => {
      if (ctx.audience === "student") {
        return {
          text: "Em Faixa você vê tempo no grau, presença em 90 dias e o histórico. Quem promove é o professor — o app só mostra se você está no caminho.",
          links: [{ href: "/aluno/evolucao", label: "Minha faixa" }],
          suggestions: ["Confirmar aula", "Mensalidade"],
        };
      }
      return {
        text: "O histórico de faixa fica na ficha do aluno (Essencial já tem). A fila de candidatos (tempo + presença) e o quadro IBJJF estão em Graduações, no plano Academia. Relatório da equipe inteira é no Equipe, em Relatórios.",
        links: [
          { href: "/academia/alunos", label: "Fichas" },
          { href: "/academia/graduacoes", label: "Candidatos" },
        ],
        suggestions: ["Relatórios de evolução", "Planos e preços"],
      };
    },
  },
  {
    id: "turmas",
    audiences: "all",
    phrases: ["criar turma", "vagas da turma", "horario", "grade"],
    keywords: ["turma", "turmas", "vaga", "horario", "horário", "agenda", "grade"],
    answer: () => ({
      text: "Em Turmas você define nome, dia, horário, duração e vagas. O aluno vê a grade da divisão no app. A agenda (seminário, campeonato, open mat) é outra tela.",
      links: [
        { href: "/academia/turmas", label: "Turmas" },
        { href: "/academia/agenda", label: "Agenda" },
      ],
      suggestions: ["Presença nas turmas", "App do aluno"],
    }),
  },
  {
    id: "estoque",
    audiences: "all",
    phrases: ["estoque de kimono", "vender faixa", "loja"],
    keywords: ["estoque", "kimono", "loja", "venda"],
    answer: () => ({
      text: "Estoque de kimonos e faixas entra no plano Academia: quantidade, tamanho, venda no nome do aluno e baixa automática. No Essencial essa tela pede upgrade.",
      links: [{ href: "/academia/estoque", label: "Estoque" }],
      suggestions: ["O que o Essencial não tem?", "Financeiro completo"],
    }),
  },
  {
    id: "mural",
    audiences: "all",
    phrases: ["mural da academia", "aviso no app"],
    keywords: ["mural", "aviso", "recado", "timeline"],
    answer: () => ({
      text: "O mural é a timeline da academia no painel e no app do aluno. Entra no plano Academia. No Essencial o menu some; no app o aluno vê um recado pedindo o plano.",
      links: [{ href: "/academia/mural", label: "Mural" }],
      suggestions: ["PWA na tela inicial", "Planos e preços"],
    }),
  },
  {
    id: "pwa",
    audiences: "all",
    phrases: ["instalar app", "tela inicial", "pwa", "offline"],
    keywords: ["pwa", "instalar", "atalho", "offline", "celular"],
    answer: (ctx) => ({
      text:
        ctx.audience === "student"
          ? "Se a academia está no Academia ou Equipe, o app pode ir para a tela inicial. No Perfil, use Instalar — ou no Safari Compartilhar → Adicionar à Tela de Início."
          : "PWA dos alunos entra no Academia e no Equipe. O service worker só registra na sessão do aluno. No Essencial o atalho não instala.",
      links:
        ctx.audience === "student"
          ? [{ href: "/aluno/perfil", label: "Instalar no perfil" }]
          : [{ href: "/planos", label: "Plano Academia" }],
      suggestions: ["Marca da academia no app", "Como o aluno entra"],
    }),
  },
  {
    id: "marca",
    audiences: "all",
    phrases: ["marca da academia", "logo no app", "via tatamex"],
    keywords: ["marca", "logo", "branding", "nome no app"],
    answer: () => ({
      text: "No plano Equipe o app do aluno é da academia: logo no topo, nome da casa, linha de Jiu-Jitsu e atalho na tela inicial com o nome da equipe. Nos outros planos o topo continua TatameX. O dono envia o logo em Configurações.",
      links: [
        { href: "/academia/configuracoes", label: "Configurações" },
        { href: "/planos", label: "Plano Equipe" },
      ],
      suggestions: ["Planos e preços", "PWA na tela inicial"],
    }),
  },
  {
    id: "relatorios",
    audiences: "all",
    phrases: ["relatorio de evolucao", "quem sumiu", "evasao"],
    keywords: ["relatorio", "relatório", "evolucao", "evolução", "evasao", "evasão"],
    answer: () => ({
      text: "Relatórios de evolução são do Equipe: presença em 30 dias, quem parou de aparecer e a fila de faixa da casa. No Academia essa tela pede upgrade.",
      links: [{ href: "/academia/evolucao", label: "Relatórios" }],
      suggestions: ["Candidatos a graduação", "Planos e preços"],
    }),
  },
  {
    id: "cadastro-academia",
    audiences: ["visitor", "owner"],
    phrases: ["abrir academia", "criar conta", "cadastrar academia"],
    keywords: ["cadastro", "registrar", "abrir", "conta", "demo"],
    answer: () => ({
      text: "Em /cadastro você cria a academia com nome, cidade, e-mail e senha. Começa no Academia, primeiro mês grátis. A Equipe Origem é só demonstração — cadastro novo não entra como Carla. Sem Supabase a casa fica neste navegador; com as chaves, grava no servidor.",
      links: [
        { href: "/cadastro", label: "Cadastrar" },
        { href: "/demo", label: "Ver demonstração" },
      ],
      suggestions: ["Planos e preços", "Como o aluno entra"],
    }),
  },
  {
    id: "senha",
    audiences: "all",
    phrases: ["esqueci a senha", "recuperar senha", "trocar senha"],
    keywords: ["senha", "recuperar", "esqueci", "login"],
    answer: () => ({
      text: "Em /recuperar-senha o TatameX manda o e-mail se o projeto tiver SMTP no Supabase. Sem isso, a cota grátis estoura e a recuperação falha — use o WhatsApp do suporte com o e-mail da conta.",
      links: [{ href: "/recuperar-senha", label: "Recuperar senha" }],
      suggestions: ["Falar com uma pessoa", "Como o aluno entra"],
      handoff: true,
    }),
  },
  {
    id: "lgpd",
    audiences: "all",
    phrases: ["apagar dados", "lgpd", "exportar ficha", "privacidade"],
    keywords: ["lgpd", "privacidade", "apagar", "exportar", "dados", "cpf"],
    answer: () => ({
      text: "A academia é controladora da ficha. Dono exporta ou pede exclusão no servidor pelas Configurações. Aluno baixa os próprios dados no Perfil. Kids exige responsável. Sem cookie de anúncio.",
      links: [
        { href: "/privacidade", label: "Privacidade" },
        { href: "/termos", label: "Termos" },
      ],
      suggestions: ["Falar com uma pessoa"],
    }),
  },
  {
    id: "humano",
    audiences: "all",
    phrases: [
      "falar com humano",
      "atendente",
      "whatsapp",
      "suporte",
      "prioridade",
    ],
    keywords: ["humano", "pessoa", "whatsapp", "suporte", "ajuda", "prioridade"],
    answer: (ctx) => ({
      text:
        ctx.plan === "equipe"
          ? `Plano Equipe: sua casa entra na frente. WhatsApp ${SUPPORT_PHONE_DISPLAY}. Diga o nome de ${house(ctx)}.`
          : `Suporte TatameX no WhatsApp ${SUPPORT_PHONE_DISPLAY}. Plano, cupom, acesso ou LGPD. Equipe tem prioridade na fila.`,
      suggestions: ["Planos e preços", "Como funciona a presença"],
      handoff: true,
    }),
  },
  {
    id: "produto",
    audiences: ["visitor"],
    phrases: ["o que e o tatamex", "para que serve", "como funciona"],
    keywords: ["tatamex", "produto", "sistema", "gestao", "gestão", "jiu"],
    answer: () => ({
      text: "TatameX é a operação da academia de Jiu-Jitsu: alunos, Pix, presença em duas etapas, faixas e estoque. Uma conta por academia. O aluno confirma a aula no celular; o professor valida quem treinou.",
      links: [
        { href: "/#produto", label: "Ver produto" },
        { href: "/demo", label: "Abrir demonstração" },
      ],
      suggestions: ["Planos e preços", "App do aluno"],
    }),
  },
];

export function greeting(ctx: ChatContext): ChatReply {
  if (ctx.audience === "student") {
    return {
      id: "ola",
      text: `Sou o assistente do TatameX. Respondo na hora sobre aula, faixa e mensalidade de ${house(ctx)}. Se precisar de gente, mando o WhatsApp.`,
      suggestions: ["Confirmar aula", "Mensalidade", "Minha faixa"],
    };
  }
  if (ctx.audience === "owner") {
    return {
      id: "ola",
      text: `Sou o assistente do TatameX. Respondo sozinho sobre presença, cobrança, planos e o app. ${house(ctx)}${planName(ctx) ? ` · ${planName(ctx)}` : ""}.`,
      suggestions: ["Presença nas turmas", "Como cobrar", "Planos e preços"],
    };
  }
  return {
    id: "ola",
    text: "Sou o assistente do TatameX. Respondo na hora sobre planos, o app do aluno e como a academia funciona. Sem fila.",
    suggestions: ["Planos e preços", "Como funciona", "App do aluno"],
  };
}
