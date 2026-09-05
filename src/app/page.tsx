import Link from "next/link";
import {
  Bell,
  Calendar,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  MessageCircle,
  Package,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { brl } from "@/lib/format";

const pains = [
  {
    title: "Mensalidade no caderno",
    body: "Quem pagou, quem atrasou e quem ganhou desconto some no WhatsApp. O caixa do mês vira adivinhação.",
  },
  {
    title: "Aluno que some",
    body: "O aluno para de treinar duas semanas e você só percebe quando a faixa some do varal. Aí já é churn.",
  },
  {
    title: "Graduação na cabeça",
    body: "Tempo de faixa, graus e presença deveriam decidir a promoção — não a memória do professor no dia do seminário.",
  },
  {
    title: "Estoque parado",
    body: "Kimono A3 acabou, faixa branca também, e o dinheiro está preso em rashguard que não gira.",
  },
];

const features = [
  {
    icon: Users,
    title: "Alunos",
    body: "Ficha completa: responsável, turma, mensalidade, observações e status (ativo, experimental, inativo).",
  },
  {
    icon: Wallet,
    title: "Financeiro",
    body: "Mensalidades do mês, atrasados, isentos, despesas e fechamento com CSV. Meta de faturamento visível.",
  },
  {
    icon: MessageCircle,
    title: "Cobrança no WhatsApp",
    body: "Mensagem pronta com Pix da casa. Um toque para cobrar, outro para baixar quando cair.",
  },
  {
    icon: GraduationCap,
    title: "Graduações",
    body: "Faixa, graus, tempo no grau e presença. Lista de quem está pronto para promover — sem surpresa no pódio.",
  },
  {
    icon: ClipboardCheck,
    title: "Presença",
    body: "Chamada com vaga da turma, visitante na porta e check-in pelo PWA. Código do dia no quadro.",
  },
  {
    icon: Package,
    title: "Estoque e loja",
    body: "Kimono, faixa e rashguard. Venda no nome do aluno, baixa o estoque e entra no caixa do mês.",
  },
  {
    icon: Calendar,
    title: "Agenda da casa",
    body: "Seminário, estadual, open mat. Quem confirmou, quem ainda não — Zap na hora.",
  },
  {
    icon: Bell,
    title: "Mural",
    body: "Seminário, mudança de horário, carona para o campeonato. A rede da academia, não o grupo do Zap.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Tatame">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#dores" className="hover:text-foreground">
              Dores
            </a>
            <a href="#produto" className="hover:text-foreground">
              Produto
            </a>
            <a href="#planos" className="hover:text-foreground">
              Planos
            </a>
            <a href="#alunos" className="hover:text-foreground">
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
      </header>

      <section className="relative overflow-hidden">
        <div className="tatami-grid tatami-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="mb-4 text-xs font-medium tracking-[0.22em] text-primary uppercase">
              Feito para dono de academia
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-extrabold sm:text-6xl">
              A academia no controle.
              <span className="gold-text"> O aluno no tatame.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Tatame organiza mensalidades, faixas, presença, estoque e o mural
              da equipe. Cada academia tem a sua conta. Os alunos marcam
              presença no celular e acompanham a própria evolução.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/academia" />}>
                Ver a academia de demonstração
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/planos" />}>
                Planos mensais
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo completa, sem cartão. Depois você liga Supabase e Stripe.
            </p>
          </div>

          <HeroPanel />
        </div>
      </section>

      <section id="dores" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs tracking-[0.2em] text-primary uppercase">
            O que tira o sono
          </p>
          <h2 className="font-display mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
            O dono treina de manhã e administra de noite. O sistema precisa
            resolver o segundo turno.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {pains.map((p) => (
              <article
                key={p.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-medium">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs tracking-[0.2em] text-primary uppercase">
            Tudo no mesmo lugar
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">
            Do caixa à faixa preta.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-xl border border-border bg-background p-5"
              >
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="alunos" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-primary uppercase">
              <Smartphone className="size-3.5" /> PWA do aluno
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
              O aluno abre o celular, marca presença e vê a própria faixa
              caminhar.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>— Check-in com o código do dia, mesmo offline.</li>
              <li>— Mural da academia: seminário, carona, horário.</li>
              <li>— Evolução: tempo de faixa, presenças, histórico de graus.</li>
              <li>— Pix da casa na mensalidade, sem perguntar no Zap.</li>
            </ul>
            <Button className="mt-6" render={<Link href="/aluno" />}>
              Entrar como aluno
            </Button>
          </div>
          <div className="mx-auto w-full max-w-xs rounded-[2rem] border border-border bg-card p-3 shadow-2xl">
            <div className="rounded-[1.5rem] bg-background p-5">
              <p className="text-xs text-muted-foreground">Hoje · Adultos Gi</p>
              <p className="mt-1 font-display text-2xl">19:30</p>
              <div className="mt-4 rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground">
                Estou no tatame
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faixa</span>
                  <span>Azul · 2 graus</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Este mês</span>
                  <span>11 treinos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No grau desde</span>
                  <span>nov 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs tracking-[0.2em] text-primary uppercase">
            Planos mensais
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold">
            Cabe no caixa da academia.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Stripe no checkout quando as chaves estiverem ligadas. Até lá, a
            demo troca de plano na hora.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`flex flex-col rounded-xl border p-6 ${
                  plan.popular
                    ? "border-primary bg-background"
                    : "border-border bg-background/60"
                }`}
              >
                {plan.popular && (
                  <p className="mb-2 text-xs font-medium text-primary">
                    Mais escolhido
                  </p>
                )}
                <h3 className="font-display text-2xl">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                <p className="mt-4 font-display text-3xl">
                  {brl(plan.price)}
                  <span className="text-sm font-sans font-normal text-muted-foreground">
                    /mês
                  </span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>— {f}</li>
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

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <CreditCard className="mx-auto size-8 text-primary" />
          <h2 className="font-display mt-4 text-3xl font-bold">
            Vou na sua academia com o Tatame aberto.
          </h2>
          <p className="mt-3 text-muted-foreground">
            O produto já nasce para ser apresentado no tatame: o dono vê o
            painel, o aluno vê o PWA. Sem enrolação de plataforma.
          </p>
          <Button className="mt-6" size="lg" render={<Link href="/academia" />}>
            Abrir a demo agora
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Tatame · gestão para academias de Jiu-Jitsu · cada academia, uma conta
      </footer>
    </div>
  );
}

function HeroPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Equipe Origem · Campinas</p>
          <p className="font-display text-xl">Painel de hoje</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
          Ao vivo
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat k="Alunos ativos" v="10" />
        <Stat k="Em atraso" v="R$ 520" warn />
        <Stat k="Presenças (30d)" v="148" />
        <Stat k="Prontos p/ grau" v="3" />
      </div>
      <div className="mt-4 rounded-xl bg-background p-3">
        <p className="text-xs text-muted-foreground">Quem parou de aparecer</p>
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Camila Rocha · roxa</span>
            <span className="text-destructive">28 dias</span>
          </div>
          <div className="flex justify-between">
            <span>Felipe Nunes · azul</span>
            <span className="text-muted-foreground">inativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  k,
  v,
  warn,
}: {
  k: string;
  v: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl bg-background p-3">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className={`mt-1 font-display text-xl ${warn ? "text-destructive" : ""}`}>
        {v}
      </p>
    </div>
  );
}
