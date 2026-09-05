import Link from "next/link";
import { Logo } from "@/components/logo";
import { BeltStrip } from "@/components/belt-badge";
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
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="JiuPro">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-neutral-400 md:flex">
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button size="sm" render={<Link href="/cadastro" />}>
              Abrir minha academia
            </Button>
          </div>
        </div>
        <div className="ponteira" />
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-sm text-primary">Sistema para academia de Jiu-Jitsu</p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] font-semibold uppercase sm:text-7xl">
              A casa no
              <br />
              controle.
              <br />
              <span className="text-primary">O aluno no tatame.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
              JiuPro organiza mensalidade, faixa, presença, estoque e o mural da
              equipe. Cada academia tem a sua conta. O aluno marca presença no
              celular e vê a própria faixa caminhar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/academia" />}>
                Ver a academia de demonstração
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/planos" />}>
                Planos mensais
              </Button>
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              Demo completa, sem cartão. Depois você liga Supabase e Stripe.
            </p>
          </div>

          <div className="border border-white/10 bg-[#111] p-5 sm:p-6">
            <p className="font-display text-sm tracking-wide text-neutral-400">
              Equipe Origem · Campinas
            </p>
            <p className="font-display mt-1 text-2xl uppercase">Quadro de faixas</p>
            <ul className="mt-5 space-y-3">
              {ranks.map((r) => (
                <li key={r.belt} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{r.name}</span>
                  <BeltStrip
                    belt={r.belt}
                    stripes={r.stripes}
                    className="h-4 w-36"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-neutral-500">
              Preta: ponteira vermelha, graus brancos. Demais: ponteira preta,
              graus brancos — como no kimono.
            </p>
          </div>
        </div>
      </section>

      <section id="dores" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display max-w-2xl text-3xl font-semibold uppercase sm:text-4xl">
            O dono treina de manhã e administra de noite.
          </h2>
          <p className="mt-3 max-w-xl text-neutral-400">
            O sistema precisa resolver o segundo turno — não virar mais uma
            planilha.
          </p>
          <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
            {pains.map((p) => (
              <article key={p.title} className="bg-background p-6">
                <p className="font-display text-primary">{p.n}</p>
                <h3 className="mt-2 font-display text-xl uppercase">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold uppercase sm:text-4xl">
            Do caixa à faixa preta.
          </h2>
          <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {coverage.map(([title, body]) => (
              <div key={title} className="border-l-2 border-primary pl-4">
                <h3 className="font-display text-lg uppercase">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="alunos" className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2">
          <div>
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
            <Button className="mt-6" render={<Link href="/aluno" />}>
              Entrar como aluno
            </Button>
          </div>
          <div className="mx-auto w-full max-w-xs border border-white/15 bg-[#111] p-5">
            <p className="text-xs text-neutral-500">Hoje · Adultos Gi</p>
            <p className="mt-1 font-display text-4xl">19:30</p>
            <div className="mt-4 bg-primary px-4 py-3 text-center text-sm font-medium text-white">
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
              <div className="flex justify-between">
                <span className="text-neutral-500">No grau desde</span>
                <span>nov 2025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold uppercase">
            Cabe no caixa da academia.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            Stripe no checkout quando as chaves estiverem ligadas. Até lá, a
            demo troca de plano na hora.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`flex flex-col border p-6 ${
                  plan.popular
                    ? "border-primary bg-background"
                    : "border-white/10 bg-background/60"
                }`}
              >
                {plan.popular && (
                  <p className="mb-2 text-xs font-medium text-primary">
                    Mais escolhido
                  </p>
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
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="ponteira mb-6 w-16" />
          <h2 className="font-display text-3xl font-semibold uppercase">
            Levo o JiuPro aberto na sua academia.
          </h2>
          <p className="mt-3 text-neutral-400">
            O dono vê o painel. O aluno vê o PWA. Sem enrolação de plataforma.
          </p>
          <Button className="mt-6" size="lg" render={<Link href="/academia" />}>
            Abrir a demo agora
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-neutral-500">
        JiuPro · gestão para academias de Jiu-Jitsu · cada academia, uma conta
      </footer>
    </div>
  );
}
