import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { brl } from "@/lib/format";

const modules = [
  ["Cadastro", "Alunos, responsáveis, turmas e status."],
  ["Financeiro", "Mensalidade, atraso, isenção e fechamento."],
  ["Presença", "Aluno confirma, a turma vê, o professor valida."],
  ["Graduação", "Tempo de faixa, graus e quem está pronto."],
  ["Estoque", "Kimono e faixa no nome do aluno."],
  ["Aplicativo", "Check-in em um toque e frequência no calendário."],
];

export default function HomePage() {
  return (
    <MarketingChrome
      dark
      nav={
        <nav className="hidden items-center gap-8 text-[13px] md:flex">
          <a href="#aulas" className="hover:text-white">
            Aulas
          </a>
          <a href="#planos" className="hover:text-white">
            Pagamentos
          </a>
          <a href="#professores" className="hover:text-white">
            Professores
          </a>
          <a href="#produto" className="hover:text-white">
            Produto
          </a>
        </nav>
      }
    >
      <section className="tatame-hero text-white">
        <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1100px] items-center gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="text-[12px] font-medium tracking-[0.22em] text-teal-300/80 uppercase">
              Bem-vindo à Origem
            </p>
            <h1 className="mt-4 max-w-lg text-[40px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-[52px]">
              Operação da academia no tatame e no celular.
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/65">
              O aluno confirma a aula. Os colegas veem quem vai. O professor
              valida quem treinou — sem código no quadro.
            </p>
            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 flex-1" render={<Link href="/cadastro" />}>
                Matricule-se agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 flex-1 border-white/20 text-white hover:bg-white/10 hover:text-white"
                render={<Link href="#aulas" />}
              >
                Conheça as aulas
              </Button>
            </div>
          </div>
          <div className="surface overflow-hidden p-0">
            <div className="border-b border-border px-5 py-4">
              <p className="text-[12px] text-muted-foreground">Painel · Equipe Origem</p>
              <p className="mt-1 text-[15px] font-medium">6 aulas hoje · 14 confirmados</p>
            </div>
            <div className="space-y-3 p-5">
              {[
                ["17:00", "Kids Gi", 9, 16],
                ["19:30", "Adultos Gi", 14, 28],
                ["20:30", "No-Gi", 8, 22],
              ].map(([t, n, c, cap]) => (
                <div key={String(t)}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span>
                      <span className="font-mono tabular-nums">{t}</span>
                      <span className="text-muted-foreground"> · {n}</span>
                    </span>
                    <span className="text-teal-300">{c} confirmados</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(Number(c) / Number(cap)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="professores" className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1100px] px-5 py-16">
          <p className="text-[12px] font-medium tracking-[0.18em] text-primary uppercase">
            Professores destacados
          </p>
          <h2 className="mt-2 text-[28px] font-medium tracking-[-0.02em]">
            Quem está no canto.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              ["Carla Mendes", "Faixa preta · dona da casa", 38],
              ["Rafael Costa", "Faixa marrom · kids e gi", 160],
            ].map(([name, role, hue]) => (
              <div key={String(name)} className="surface flex items-center gap-4 p-5">
                <span
                  className="flex size-16 items-center justify-center rounded-full text-lg font-medium text-white"
                  style={{ background: `hsl(${hue} 18% 28%)` }}
                >
                  {String(name)
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")}
                </span>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="aulas" className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1100px] px-5 py-16">
          <p className="text-[12px] font-medium tracking-[0.18em] text-primary uppercase">
            Grade de horários
          </p>
          <h2 className="mt-2 text-[28px] font-medium tracking-[-0.02em]">
            A semana da Equipe Origem.
          </h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="text-[12px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-3 font-medium">Horário</th>
                  <th className="px-3 py-3 font-medium">Turma</th>
                  <th className="px-3 py-3 font-medium">Dias</th>
                  <th className="px-3 py-3 font-medium">Professor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["18:00", "Kids 7–12", "Ter e qui", "Rafael"],
                  ["18:30", "Turma feminina", "Quarta", "Carla"],
                  ["19:30", "Adultos Gi", "Seg, qua e sex", "Carla"],
                  ["20:30", "No-Gi", "Ter e qui", "Rafael"],
                  ["10:00", "Competição", "Sábado", "Carla"],
                ].map((row) => (
                  <tr key={row.join()} className="border-t border-border">
                    {row.map((cell) => (
                      <td key={cell} className="px-3 py-3">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="produto" className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1100px] px-5 py-16">
          <p className="text-[12px] font-medium tracking-[0.18em] text-primary uppercase">
            Painel
          </p>
          <h2 className="mt-2 max-w-xl text-[28px] leading-tight font-medium tracking-[-0.02em]">
            Confirmados na aula, atraso no caixa, faixa no aluno.
          </h2>
          <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(([title, body]) => (
              <div key={title} className="border-t border-border pt-4">
                <dt className="text-[14px] font-medium">{title}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="planos" className="bg-card">
        <div className="mx-auto max-w-[1100px] px-5 py-16">
          <p className="text-[12px] font-medium tracking-[0.18em] text-primary uppercase">
            Pagamentos
          </p>
          <h2 className="mt-2 text-[28px] font-medium tracking-[-0.02em]">
            Uma assinatura por academia.
          </h2>
          <p className="mt-3 max-w-lg text-[14px] text-muted-foreground">
            Alunos pagam a mensalidade para você, pelo Pix da casa. A cobrança
            do JiuPro entra depois — a operação já funciona.
          </p>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-[12px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Alunos</th>
                  <th className="px-4 py-3 font-medium">Inclui</th>
                  <th className="px-4 py-3 font-medium">Mensal</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {PLANS.map((plan) => (
                  <tr key={plan.id} className="border-t border-border">
                    <td className="px-4 py-4 font-medium">
                      {plan.name}
                      {plan.popular ? (
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          recomendado
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">{plan.students}</td>
                    <td className="px-4 py-4 text-muted-foreground">{plan.blurb}</td>
                    <td className="px-4 py-4 font-medium tabular-nums">{brl(plan.price)}</td>
                    <td className="px-4 py-4 text-right">
                      <Button size="sm" render={<Link href={`/cadastro?plano=${plan.id}`} />}>
                        Selecionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-2 px-5 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>JiuPro</span>
          <span>Gestão para academias de Jiu-Jitsu. Cada academia, uma conta.</span>
        </div>
      </footer>
    </MarketingChrome>
  );
}
