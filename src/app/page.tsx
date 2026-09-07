import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
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
    body: "O aluno para de treinar duas semanas e você só percebe quando a faixa some do varal.",
  },
  {
    title: "Graduação na memória",
    body: "Tempo de faixa, graus e presença deveriam decidir a promoção — não o palpite no dia do seminário.",
  },
  {
    title: "Estoque parado",
    body: "Kimono A3 acabou, faixa branca também, e o dinheiro está preso em rashguard que não gira.",
  },
];

const coverage = [
  ["Alunos", "Ficha, responsável, turma, status e observações."],
  ["Financeiro", "Mensalidade, atraso, isenção, despesa e fechamento em CSV."],
  ["Cobrança", "WhatsApp com Pix da casa. Um toque para baixar."],
  ["Graduações", "Faixa, graus, tempo e presença. Quem está pronto para promover."],
  ["Presença", "Chamada, visitante na porta e código do dia."],
  ["Estoque", "Kimono e faixa no nome do aluno. Baixa o estoque, entra no caixa."],
  ["Agenda", "Seminário, estadual, open mat. Quem confirmou, quem falta."],
  ["Mural", "Horário, carona, campeonato — a rede da academia."],
];

export default function HomePage() {
  return (
    <MarketingChrome
      nav={
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#produto" className="hover:text-foreground">
            Produto
          </a>
          <a href="#alunos" className="hover:text-foreground">
            App do aluno
          </a>
          <a href="#planos" className="hover:text-foreground">
            Preços
          </a>
        </nav>
      }
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <p className="text-sm font-medium text-primary">
            Software para academias de Jiu-Jitsu
          </p>
          <h1 className="font-serif mt-4 text-4xl leading-[1.15] text-balance sm:text-5xl lg:text-[3.25rem]">
            A operação da casa, com a clareza de um escritório.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Alunos, mensalidades, faixas, presença e estoque. Cada academia tem
            a sua conta. O aluno marca presença no celular e acompanha a própria
            faixa.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/cadastro" />}>
              Abrir minha academia
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/demo" />}>
              Ver demonstração
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartão agora. Mensalidade do aluno pelo Pix da academia.
          </p>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-medium text-muted-foreground">
            Feito para quem treina de manhã e fecha o caixa à noite
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pains.map((p) => (
              <article key={p.title}>
                <h2 className="text-sm font-semibold tracking-tight">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-serif text-3xl text-balance sm:text-4xl">
            Do caixa à faixa preta, no mesmo sistema.
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {coverage.map(([title, body]) => (
              <article key={title} className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="alunos" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">Aplicativo do aluno</p>
            <h2 className="font-serif mt-3 text-3xl text-balance sm:text-4xl">
              Presença, faixa e mural no celular.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Check-in com o código do dia, mesmo offline.</li>
              <li>Mural da academia: seminário, carona, horário.</li>
              <li>Evolução: tempo de faixa, presenças, histórico de graus.</li>
              <li>Pix da casa na mensalidade, sem perguntar no Zap.</li>
            </ul>
            <Button className="mt-8" render={<Link href="/demo?as=aluno" />}>
              Entrar como aluno
            </Button>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[20rem] rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs text-muted-foreground">Hoje · Adultos Gi</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight">19:30</p>
              <p className="mt-1 text-sm text-muted-foreground">Gi · 60 min</p>
              <div className="mt-6 rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-white">
                Estou no tatame
              </div>
              <div className="mt-5 flex justify-between text-sm">
                <span className="text-muted-foreground">Este mês</span>
                <span className="font-medium">11 treinos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-serif text-3xl sm:text-4xl">Planos mensais</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Uma assinatura por academia. Alunos pagam a mensalidade para você,
            pelo Pix da casa. A cobrança do JiuPro entra depois.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`surface flex flex-col p-6 ${plan.popular ? "ring-1 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <p className="mb-2 text-xs font-medium text-primary">Mais escolhido</p>
                )}
                <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                <p className="mt-5 text-3xl font-semibold tracking-tight">
                  {brl(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
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

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl text-balance sm:text-4xl">
              Leve o JiuPro para a sua academia.
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              O dono vê o painel. O aluno vê o aplicativo. Sem enrolação de
              plataforma.
            </p>
          </div>
          <Button size="lg" render={<Link href="/cadastro" />}>
            Abrir minha academia
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        JiuPro · gestão para academias de Jiu-Jitsu · cada academia, uma conta
      </footer>
    </MarketingChrome>
  );
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#e4e2dc]" />
        <span className="size-2.5 rounded-full bg-[#e4e2dc]" />
        <span className="size-2.5 rounded-full bg-[#e4e2dc]" />
        <span className="ml-3 text-xs text-muted-foreground">jiupro.app / academia</span>
      </div>
      <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="hidden border-r border-border p-4 lg:block">
          <p className="text-xs font-semibold">Equipe Origem</p>
          <p className="text-xs text-muted-foreground">Campinas/SP</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            <li className="rounded-md bg-muted px-2 py-1 font-medium">Visão do dia</li>
            <li className="px-2 py-1 text-muted-foreground">Alunos</li>
            <li className="px-2 py-1 text-muted-foreground">Presença</li>
            <li className="px-2 py-1 text-muted-foreground">Cobranças</li>
            <li className="px-2 py-1 text-muted-foreground">Configurações</li>
          </ul>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Segunda · setembro</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">Visão do dia</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              ["No tatame", "18"],
              ["Ativos", "86"],
              ["Em atraso", "R$ 1.240"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{k}</p>
                <p className="text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {[
              ["19:30", "Adultos Gi", "12/20"],
              ["20:30", "No-Gi avançado", "9/16"],
            ].map(([t, n, c]) => (
              <div
                key={t}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium tabular-nums">{t}</span>
                  <span className="text-muted-foreground"> · {n}</span>
                </span>
                <span className="text-muted-foreground">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
