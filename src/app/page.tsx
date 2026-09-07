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
        <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
          <a href="#dores" className="hover:text-white">
            Dores
          </a>
          <a href="#produto" className="hover:text-white">
            Sistema
          </a>
          <a href="#alunos" className="hover:text-white">
            App
          </a>
          <a href="#planos" className="hover:text-white">
            Planos
          </a>
        </nav>
      }
    >
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <span className="size-1.5 rounded-full bg-primary" />
              Sistema para academia de Jiu-Jitsu
            </p>
            <h1 className="font-display mt-6 text-[4.2rem] leading-[0.86] sm:text-8xl lg:text-[7.5rem]">
              A casa
              <br />
              no controle.
              <br />
              <span className="text-primary">Não a planilha.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
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
            <p className="mt-4 text-xs text-zinc-500">
              Sem cartão agora. Cadastro abre a sua casa. Mensalidade do aluno
              pelo Pix da academia.
            </p>
          </div>

          <div className="surface relative overflow-hidden p-6 sm:p-8">
            <p className="font-display text-sm tracking-[0.22em] text-zinc-500">
              Origem · Campinas
            </p>
            <p className="mt-2 text-sm text-zinc-400">Quadro de faixas da casa</p>
            <div className="mt-8 space-y-5">
              {ranks.map((r) => (
                <div key={r.belt}>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{r.name}</span>
                    <span>{r.stripes} graus</span>
                  </div>
                  <BeltStrip belt={r.belt} stripes={r.stripes} className="h-4 w-full rounded-sm" />
                </div>
              ))}
            </div>
            <p className="mt-8 text-xs leading-relaxed text-zinc-600">
              Preta: ponteira vermelha. Demais: ponteira preta. Graus brancos —
              como no kimono.
            </p>
          </div>
        </div>
      </section>

      <section id="dores" className="border-t border-white/8">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <p className="text-sm text-primary">O segundo turno</p>
            <h2 className="font-display mt-2 text-5xl leading-none sm:text-6xl">
              O dono treina de manhã e administra de noite.
            </h2>
            <p className="mt-4 text-zinc-400">
              O sistema precisa resolver o que sobra depois do treino — não virar
              mais uma aba.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {pains.map((p) => (
              <article key={p.title} className="surface p-6">
                <p className="font-display text-3xl text-primary">{p.n}</p>
                <h3 className="font-display mt-3 text-2xl">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="border-t border-white/8">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-5xl leading-none sm:text-6xl">
            Do caixa à faixa preta.
          </h2>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {coverage.map(([title, body]) => (
              <article key={title} className="surface p-5">
                <h3 className="font-display text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="alunos" className="border-t border-white/8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm text-primary">PWA do aluno</p>
            <h2 className="font-display mt-2 text-5xl leading-none sm:text-6xl">
              Abre o celular, marca presença, vê a faixa.
            </h2>
            <ul className="mt-8 space-y-3 text-sm text-zinc-400">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Check-in com o código do dia, mesmo offline.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Mural da academia: seminário, carona, horário.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Evolução: tempo de faixa, presenças, histórico de graus.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                Pix da casa na mensalidade, sem perguntar no Zap.
              </li>
            </ul>
            <Button className="mt-8" size="lg" render={<Link href="/demo?as=aluno" />}>
              Entrar como aluno
            </Button>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-[20rem] rounded-[2rem] border border-white/12 bg-[#0c0c0e] p-5 shadow-[0_30px_80px_rgb(196_30_58_/_0.12)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-zinc-500">Hoje · Adultos Gi</p>
                <span className="font-display text-sm tracking-widest text-zinc-600">
                  JIUPRO
                </span>
              </div>
              <p className="font-display mt-8 text-6xl leading-none">19:30</p>
              <div className="mt-6 rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-medium text-white">
                Estou no tatame
              </div>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Faixa</span>
                  <BeltStrip belt="blue" stripes={2} />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Este mês</span>
                  <span>11 treinos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-white/8">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-5xl leading-none sm:text-6xl">
            Cabe no caixa da academia.
          </h2>
          <p className="mt-4 max-w-xl text-zinc-400">
            Escolhe o plano e abre a casa. A cobrança do JiuPro entra depois —
            a academia já funciona sem cartão.
          </p>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`surface flex flex-col p-6 ${
                  plan.popular ? "ring-1 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <p className="mb-2 text-xs font-medium text-primary">Mais escolhido</p>
                )}
                <h3 className="font-display text-3xl">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{plan.blurb}</p>
                <p className="font-display mt-5 text-4xl">
                  {brl(plan.price)}
                  <span className="font-sans text-sm font-normal text-zinc-500">/mês</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-zinc-400">
                  {plan.features.map((f) => (
                    <li key={f}>— {f}</li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
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

      <section className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-5xl leading-none sm:text-6xl">
              Levo o JiuPro aberto
              <br />
              na sua academia.
            </h2>
            <p className="mt-4 max-w-md text-zinc-400">
              O dono vê o quadro. O aluno vê o PWA. Sem enrolação de plataforma.
            </p>
          </div>
          <Button size="lg" render={<Link href="/cadastro" />}>
            Abrir minha academia
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/8 py-10 text-center text-xs text-zinc-500">
        JiuPro · gestão para academias de Jiu-Jitsu · cada academia, uma conta
      </footer>
    </MarketingChrome>
  );
}
