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
  ["Aplicativo", "Confirma a aula, vê quem vai e espera o aceite."],
];

export default function HomePage() {
  return (
    <MarketingChrome
      dark
      nav={
        <nav className="hidden items-center gap-8 text-[13px] md:flex">
          <a href="#produto" className="hover:text-white">
            Produto
          </a>
          <a href="#app" className="hover:text-white">
            Aplicativo
          </a>
          <a href="#planos" className="hover:text-white">
            Planos
          </a>
        </nav>
      }
    >
      <section className="bg-[#111] text-white">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[720px] flex-col items-center justify-center px-5 py-24 text-center">
          <p className="text-[12px] font-medium tracking-[0.22em] text-white/50 uppercase">
            Sistema de gestão
          </p>
          <h1 className="mt-5 text-[40px] leading-[1.1] font-medium tracking-[-0.03em] sm:text-[52px]">
            Operação da academia.
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/60">
            Alunos, mensalidades, presença, faixas e estoque. Uma conta por
            casa. O aluno confirma a aula; os colegas veem a lista; o professor
            valida quem realmente treinou.
          </p>
          <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-11 flex-1 rounded-[2px] bg-white text-[#111] hover:bg-white/90"
              render={<Link href="/cadastro" />}
            >
              Começar
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 flex-1 rounded-[2px] border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/demo" />}
            >
              Demonstração
            </Button>
          </div>
        </div>
      </section>

      <section id="produto" className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-16">
          <p className="text-[12px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Painel
          </p>
          <h2 className="mt-2 max-w-xl text-[28px] leading-tight font-medium tracking-[-0.02em]">
            O mesmo recorte de um sistema corporativo: navegação, dados, ação.
          </h2>
          <div className="mt-10 overflow-hidden border border-border">
            <ProductPreview />
          </div>
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

      <section id="app" className="border-b border-border bg-[#f3f2f1]">
        <div className="mx-auto grid max-w-[1100px] items-center gap-12 px-5 py-16 lg:grid-cols-2">
          <div>
            <p className="text-[12px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Aplicativo do aluno
            </p>
            <h2 className="mt-2 text-[28px] leading-tight font-medium tracking-[-0.02em]">
              Presença confirmada. Faixa visível.
            </h2>
            <ul className="mt-6 space-y-2 text-[14px] text-muted-foreground">
              <li>Confirma a aula com o código da turma. Os colegas veem quem vai.</li>
              <li>Grade da semana e mural da casa.</li>
              <li>Histórico de faixa, graus e treinos.</li>
              <li>Pix da academia na mensalidade.</li>
            </ul>
            <Button className="mt-8" render={<Link href="/demo?as=aluno" />}>
              Abrir o aplicativo
            </Button>
          </div>
          <div className="border border-border bg-white p-6">
            <p className="text-[12px] text-muted-foreground">Confirmou · Adultos Gi</p>
            <p className="mt-4 font-mono text-[32px] tracking-tight">19:30</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Gi · 75 min · código da turma</p>
            <div className="mt-5 border border-border py-3 text-center font-mono text-[18px] tracking-[0.35em]">
              4821
            </div>
            <div className="mt-3 bg-[#111] px-4 py-3 text-center text-[13px] font-medium text-white">
              Confirmar que vou
            </div>
            <p className="mt-4 text-[12px] text-muted-foreground">Na lista · Ana, Marina, Thiago</p>
          </div>
        </div>
      </section>

      <section id="planos" className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-16">
          <p className="text-[12px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Contratação
          </p>
          <h2 className="mt-2 text-[28px] font-medium tracking-[-0.02em]">
            Uma assinatura por academia.
          </h2>
          <p className="mt-3 max-w-lg text-[14px] text-muted-foreground">
            Alunos pagam a mensalidade para você, pelo Pix da casa. A cobrança
            do JiuPro entra depois — a operação já funciona.
          </p>
          <div className="mt-10 overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="bg-[#f3f2f1] text-[12px] tracking-wide text-muted-foreground uppercase">
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

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-2 px-5 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>JiuPro</span>
          <span>Gestão para academias de Jiu-Jitsu. Cada academia, uma conta.</span>
        </div>
      </footer>
    </MarketingChrome>
  );
}

function ProductPreview() {
  return (
    <div className="bg-white">
      <div className="flex h-10 items-center border-b border-border bg-white px-4 text-[12px]">
        <span className="font-medium tracking-[0.2em] uppercase">JiuPro</span>
        <span className="mx-3 text-muted-foreground">/</span>
        <span>Equipe Origem</span>
        <span className="ml-auto text-muted-foreground">Campinas/SP</span>
      </div>
      <div className="grid min-h-[280px] lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="hidden border-r border-border py-2 lg:block">
          {["Início", "Alunos", "Presença", "Cobranças", "Configurações"].map(
            (item, i) => (
              <div
                key={item}
                className={`border-l-2 px-4 py-2 text-[13px] ${
                  i === 2
                    ? "border-foreground bg-[#f3f2f1] font-medium"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {item}
              </div>
            ),
          )}
        </div>
        <div className="p-5">
          <p className="text-[12px] text-muted-foreground">Operação / Presença</p>
          <p className="mt-1 text-[16px] font-medium">Adultos Gi · 19:30</p>
          <div className="mt-4 grid grid-cols-3 border border-border">
            {[
              ["Aguardando", "2"],
              ["Validados", "1"],
              ["Vagas", "25"],
            ].map(([k, v], i) => (
              <div
                key={k}
                className={`px-3 py-3 ${i ? "border-l border-border" : ""}`}
              >
                <p className="text-[11px] text-muted-foreground">{k}</p>
                <p className="mt-1 text-[16px] font-medium tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-end justify-between border border-border px-3 py-3">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Código desta aula
              </p>
              <p className="mt-1 font-mono text-[28px] tracking-[0.22em]">4821</p>
            </div>
            <p className="text-[12px] text-muted-foreground">Aceite do professor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
