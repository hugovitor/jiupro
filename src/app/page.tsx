import Link from "next/link";
import { BeltStrip } from "@/components/belt-badge";
import { MarketingChrome } from "@/components/marketing-chrome";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { brl } from "@/lib/format";

const ranks = [
  { belt: "white", stripes: 4, name: "Branca" },
  { belt: "blue", stripes: 2, name: "Azul" },
  { belt: "purple", stripes: 3, name: "Roxa" },
  { belt: "brown", stripes: 1, name: "Marrom" },
  { belt: "black", stripes: 3, name: "Preta" },
];

const pains = [
  {
    n: "01",
    title: "Mensalidade no caderno",
    body: "Quem pagou, quem atrasou e quem ganhou desconto some no WhatsApp. O caixa do mês vira adivinhação.",
  },
  {
    n: "02",
    title: "Aluno que some",
    body: "O aluno para de treinar duas semanas e você só percebe quando a faixa some do varal.",
  },
  {
    n: "03",
    title: "Graduação na cabeça",
    body: "Tempo de faixa, graus e presença deveriam decidir a promoção — não a memória no dia do seminário.",
  },
  {
    n: "04",
    title: "Estoque parado",
    body: "Kimono A3 acabou, faixa branca também, e o dinheiro está preso em rashguard que não gira.",
  },
];

const coverage = [
  ["Alunos", "Ficha, responsável, turma, status e observações."],
  ["Financeiro", "Mensalidade, atraso, isenção, despesa e fechamento em CSV."],
  ["WhatsApp", "Cobrança pronta com Pix da casa. Um toque para baixar."],
  ["Graduações", "Faixa, graus, tempo e presença. Quem está pronto para promover."],
  ["Presença", "Chamada, vaga da turma, visitante na porta e código do dia."],
  ["Loja", "Kimono e faixa no nome do aluno. Baixa o estoque, entra no caixa."],
  ["Agenda", "Seminário, estadual, open mat. Quem confirmou, quem falta."],
  ["Mural", "Horário, carona, campeonato. A rede da academia, não o grupo do Zap."],
];

export default function HomePage() {
  return (
    <MarketingChrome
      nav={
        <nav className="hidden items-center gap-6 text-sm text-neutral-400 md:flex">
          <a href="#dores" className="hover:text-white">
            Dores
          </a>
          <a href="#produto" className="hover:text-white">
            O sistema
          </a>
          <a href="#planos" className="hover:text-white">
            Planos
          </a>
          <a href="#alunos" className="hover:text-white">
            App do aluno
          </a>
        </nav>
      }
    >
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-end gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center lg:py-0">
          <div className="max-w-2xl pb-4 lg:py-20">
            <p className="text-sm text-primary">Sistema para academia de Jiu-Jitsu</p>
            <h1 className="font-display mt-4 text-[3.25rem] leading-[0.88] font-semibold uppercase sm:text-7xl lg:text-8xl">
              Quadro
              <br />
              da casa.
              <br />
              <span className="text-primary">Não planilha.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-400 sm:text-lg">
              Mensalidade, faixa, presença, estoque e mural. Cada academia tem a
              sua conta. O aluno marca presença no celular e vê a própria faixa
              caminhar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/cadastro" />}>
                Abrir minha academia
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/demo" />}>
                Ver a demo
              </Button>
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              Sem cartão agora. Cadastro abre a sua casa. Mensalidade do aluno
              pelo Pix da academia; Asaas e Stripe entram depois.
            </p>
          </div>

          <aside className="hidden h-full flex-col justify-center gap-5 border-l border-white/10 py-16 pl-8 lg:flex">
            <p className="font-display text-xs tracking-[0.2em] text-neutral-500 uppercase">
              Origem · Campinas
            </p>
            {ranks.map((r) => (
              <div key={r.belt}>
                <p className="mb-1.5 text-[11px] text-neutral-500">{r.name}</p>
                <BeltStrip belt={r.belt} stripes={r.stripes} className="h-3.5 w-full" />
              </div>
            ))}
            <p className="text-[11px] leading-relaxed text-neutral-600">
              Preta: ponteira vermelha. Demais: ponteira preta. Graus brancos —
              como no kimono.
            </p>
          </aside>
        </div>
      </section>

      <section className="lg:hidden border-t border-white/10 px-4 py-8">
        <p className="font-display text-xs tracking-[0.2em] text-neutral-500 uppercase">
          Quadro de faixas
        </p>
        <ul className="mt-4 space-y-3">
          {ranks.map((r) => (
            <li key={r.belt} className="flex items-center justify-between gap-3">
              <span className="text-sm">{r.name}</span>
              <BeltStrip belt={r.belt} stripes={r.stripes} className="h-4 w-36" />
            </li>
          ))}
        </ul>
      </section>

      <section id="dores" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-semibold uppercase sm:text-4xl">
              O dono treina de manhã e administra de noite.
            </h2>
            <p className="mt-3 text-neutral-400">
              O sistema precisa resolver o segundo turno — não virar mais uma
              planilha.
            </p>
          </div>
          <ol className="mt-10 divide-y divide-white/10 lg:mt-0">
            {pains.map((p) => (
              <li key={p.title} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 py-6">
                <p className="font-display text-primary">{p.n}</p>
                <div>
                  <h3 className="font-display text-xl uppercase">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="produto" className="border-t border-white/10 bg-[#0c0c0c]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold uppercase sm:text-4xl">
            Do caixa à faixa preta.
          </h2>
          <div className="mt-10 columns-1 sm:columns-2 gap-x-16">
            {coverage.map(([title, body]) => (
              <div key={title} className="mb-8 break-inside-avoid border-t border-white/10 pt-4">
                <h3 className="font-display text-lg uppercase">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="alunos" className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[1fr_22rem]">
          <div className="px-4 py-16 lg:pr-12">
            <p className="text-sm text-primary">PWA do aluno</p>
            <h2 className="font-display mt-2 text-3xl font-semibold uppercase sm:text-4xl">
              Abre o celular, marca presença, vê a faixa.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-neutral-400">
              <li>Check-in com o código do dia, mesmo offline.</li>
              <li>Mural da academia: seminário, carona, horário.</li>
              <li>Evolução: tempo de faixa, presenças, histórico de graus.</li>
              <li>Pix da casa na mensalidade, sem perguntar no Zap.</li>
            </ul>
            <Button className="mt-6" render={<Link href="/demo?as=aluno" />}>
              Entrar como aluno
            </Button>
          </div>
          <div className="flex items-end justify-center bg-[#111] px-6 py-10 lg:py-16">
            <div className="w-full max-w-[17rem] bg-[#0a0a0a] p-5 ring-1 ring-white/12">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-neutral-500">Hoje · Adultos Gi</p>
                <span className="text-[11px] tracking-wide text-neutral-600">JIUPRO</span>
              </div>
              <p className="mt-6 font-display text-5xl leading-none">19:30</p>
              <div className="mt-5 bg-primary px-4 py-3 text-center text-sm font-medium text-white">
                Estou no tatame
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Faixa</span>
                  <BeltStrip belt="blue" stripes={2} />
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Este mês</span>
                  <span>11 treinos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-white/10 bg-[#0c0c0c]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold uppercase">
            Cabe no caixa da academia.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            Escolhe o plano e abre a academia. A cobrança do JiuPro (Stripe)
            entra depois — a casa já funciona sem cartão.
          </p>
          <div className="mt-10 grid gap-px bg-white/10 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`flex flex-col bg-background p-6 ${
                  plan.popular ? "ring-1 ring-inset ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <p className="mb-2 text-xs font-medium text-primary">Mais escolhido</p>
                )}
                <h3 className="font-display text-2xl uppercase">{plan.name}</h3>
                <p className="mt-1 text-sm text-neutral-400">{plan.blurb}</p>
                <p className="mt-4 font-display text-3xl">
                  {brl(plan.price)}
                  <span className="text-sm font-sans font-normal text-neutral-500">
                    /mês
                  </span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-neutral-400">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  render={<Link href={`/cadastro?plano=${plan.id}`} />}
                >
                  Começar
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold uppercase sm:text-4xl">
              Levo o JiuPro aberto
              <br />
              na sua academia.
            </h2>
            <p className="mt-3 max-w-md text-neutral-400">
              O dono vê o quadro. O aluno vê o PWA. Sem enrolação de plataforma.
            </p>
          </div>
          <Button size="lg" render={<Link href="/cadastro" />}>
            Abrir minha academia
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-neutral-500">
        JiuPro · gestão para academias de Jiu-Jitsu · cada academia, uma conta
      </footer>
    </MarketingChrome>
  );
}
