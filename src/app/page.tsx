"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  GraduationCap,
  Package,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import {
  BeltMark,
  Eyebrow,
  SectionHeading,
  SiteFooter,
  SiteHeader,
} from "@/components/brand";
import { brl } from "@/lib/format";
import { PLANS, planCapacityLabel } from "@/lib/plans";

const modules = [
  {
    title: "Cadastro completo",
    body: "Alunos, responsáveis, turmas, contatos e situação da matrícula.",
    icon: Users,
    href: "/demo?next=/academia/alunos",
  },
  {
    title: "Gestão financeira",
    body: "Mensalidades, atrasos, isenções, cobranças e fechamento mensal.",
    icon: CircleDollarSign,
    href: "/demo?next=/academia/financeiro",
  },
  {
    title: "Presença no tatame",
    body: "O aluno confirma, a turma acompanha e o professor valida a presença.",
    icon: ClipboardCheck,
    href: "/demo?next=/academia/presenca",
  },
  {
    title: "Faixas e graduações",
    body: "Acompanhe tempo de faixa, graus, frequência e alunos preparados.",
    icon: GraduationCap,
    href: "/demo?next=/academia/graduacoes",
  },
  {
    title: "Estoque da academia",
    body: "Controle kimonos, faixas, tamanhos, vendas e retiradas por aluno.",
    icon: Package,
    href: "/demo?next=/academia/estoque",
  },
  {
    title: "Aplicativo do aluno",
    body: "Aulas, presença, graduação e mensalidades em um único lugar.",
    icon: Smartphone,
    href: "/demo?as=aluno",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white selection:bg-red-600 selection:text-white">
      <SiteHeader
        variant="landing"
        nav={
          <>
            <a href="#produto" className="transition hover:text-white">
              Produto
            </a>
            <a href="#app" className="transition hover:text-white">
              Aplicativo
            </a>
            <a href="#planos" className="transition hover:text-white">
              Planos
            </a>
          </>
        }
      />
      <Hero />
      <TrustBar />
      <ProductSection />
      <AppSection />
      <PlansSection />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative isolate min-h-[850px] overflow-hidden pt-16">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_75%_25%,rgba(220,38,38,0.16),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute -right-40 top-32 -z-10 h-[600px] w-[600px] rounded-full border border-red-600/15" />
      <div className="absolute top-56 -right-16 -z-10 h-[360px] w-[360px] rounded-full border border-white/10" />

      <div className="mx-auto grid min-h-[790px] max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <Eyebrow className="mb-7 text-xs">Gestão completa para sua academia</Eyebrow>

          <h1 className="text-5xl leading-[0.98] font-black tracking-[-0.055em] sm:text-6xl lg:text-[78px]">
            Sua academia.
            <span className="mt-2 block text-white/45">No próximo nível.</span>
          </h1>

          <div className="mt-8 flex max-w-2xl gap-5">
            <div className="hidden w-1 shrink-0 bg-gradient-to-b from-red-600 via-red-600 to-transparent sm:block" />
            <p className="text-base leading-8 text-white/58 sm:text-lg">
              Alunos, mensalidades, presença, graduações e estoque em uma
              plataforma criada para quem vive o Jiu-Jitsu dentro e fora do
              tatame.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="group inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-red-600 px-7 text-sm font-extrabold transition hover:bg-red-500"
            >
              Criar minha academia
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-7 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              Explorar demonstração
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-white/45">
            {["Configuração rápida", "Sem taxa de implantação", "Suporte especializado"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  {item}
                </span>
              ),
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-8 -z-10 rounded-full bg-red-600/10 blur-3xl" />
          <DashboardPreview />
          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/10 bg-[#121212] p-4 shadow-2xl lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-white/40">Presença confirmada</p>
                <p className="mt-0.5 text-sm font-bold">Carlos entrou no tatame</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-white/10 bg-white/[0.025]">
      <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
        {[
          ["100%", "da operação centralizada"],
          ["1 toque", "para confirmar presença"],
          ["24 horas", "de acesso à gestão"],
        ].map(([value, label]) => (
          <div key={value} className="flex items-center justify-center gap-4 py-7">
            <strong className="text-2xl font-black tracking-tight text-red-500">
              {value}
            </strong>
            <span className="max-w-[120px] text-xs leading-5 text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductSection() {
  return (
    <section id="produto" className="relative bg-[#f5f5f3] py-24 text-[#101010] lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="A academia sob controle"
          title="Menos planilhas. Mais tempo no tatame."
          description="Cada módulo foi pensado para simplificar a rotina da recepção, do professor e do gestor."
          dark={false}
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.06 }}
              >
                <Link
                  href={module.href}
                  className="group relative block overflow-hidden rounded-2xl border border-black/8 bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1 hover:border-red-600/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-red-600 transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition group-hover:bg-red-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-7 text-lg font-extrabold tracking-tight">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/55">{module.body}</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-red-600 transition group-hover:gap-2">
                    Conhecer recurso <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AppSection() {
  return (
    <section id="app" className="relative overflow-hidden bg-[#0b0b0b] py-24 lg:py-32">
      <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-red-600 to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Aplicativo do aluno"
            title="Confirmar. Encontrar a equipe. Treinar."
            description="A experiência do aluno também representa a sua academia. Simples, rápida e com tudo o que ele precisa."
            dark
          />

          <div className="mt-10 space-y-5">
            {[
              [
                "Confirmação em um toque",
                "O aluno confirma a aula sem códigos ou filas na recepção.",
              ],
              [
                "Equipe conectada",
                "Todos visualizam quem estará no treino antes da aula começar.",
              ],
              [
                "Evolução visível",
                "Frequência, faixa e graus sempre disponíveis no aplicativo.",
              ],
            ].map(([title, body], index) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-[11px] font-black text-red-400">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/45">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/demo?as=aluno"
            className="mt-10 inline-flex items-center gap-2 text-sm font-extrabold text-red-500 transition hover:text-red-400"
          >
            Abrir aplicativo do aluno <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <PhonePreview />
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section id="planos" className="bg-white py-24 text-[#111] lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Planos e contratação"
          title="Um plano para cada fase da sua academia."
          description="Sem taxa de implantação. Escolha o plano, cadastre sua equipe e comece a organizar a operação."
          dark={false}
          centered
        />

        <div className="mt-16 grid items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl border p-7 ${
                plan.popular
                  ? "border-red-600 bg-[#0b0b0b] text-white shadow-2xl shadow-red-950/15 lg:-translate-y-3"
                  : "border-black/10 bg-[#fafafa]"
              }`}
            >
              {plan.popular ? (
                <div className="absolute top-0 right-0 bg-red-600 px-4 py-2 text-[10px] font-black tracking-[0.18em] text-white uppercase">
                  Recomendado
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${plan.popular ? "bg-red-500" : "bg-black"}`}
                />
                <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
              </div>
              <p className={`mt-4 text-sm ${plan.popular ? "text-white/45" : "text-black/50"}`}>
                {planCapacityLabel(plan)}
              </p>
              <div className="mt-6 flex items-end gap-1">
                <strong className="text-4xl font-black tracking-[-0.05em]">{brl(plan.price)}</strong>
                <span className={`pb-1 text-xs ${plan.popular ? "text-white/40" : "text-black/40"}`}>
                  /mês
                </span>
              </div>
              <p
                className={`mt-5 min-h-12 text-sm leading-6 ${plan.popular ? "text-white/50" : "text-black/50"}`}
              >
                {plan.blurb}
              </p>
              <div className={`my-7 h-px ${plan.popular ? "bg-white/10" : "bg-black/10"}`} />
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-3 text-sm ${plan.popular ? "text-white/75" : "text-black/65"}`}
                  >
                    <Check className="h-4 w-4 text-red-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/cadastro?plano=${plan.id}`}
                className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl text-sm font-extrabold transition ${
                  plan.popular
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "bg-black text-white hover:bg-red-600"
                }`}
              >
                Escolher {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-red-700">
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(135deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%)] [background-size:80px_80px]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 lg:flex-row lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-black tracking-[0.24em] text-white/60 uppercase">
            Suba de nível
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Sua academia merece uma gestão faixa preta.
          </h2>
        </div>
        <Link
          href="/cadastro"
          className="inline-flex h-12 shrink-0 items-center gap-3 rounded-xl bg-white px-7 text-sm font-black text-red-700 transition hover:bg-black hover:text-white"
        >
          Começar agora <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const rows: [string, string, string, number][] = [
    ["19:30", "Adultos Gi", "14 confirmados", 72],
    ["20:30", "No-Gi", "8 confirmados", 45],
    ["21:30", "Competição", "11 confirmados", 60],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-[0_40px_100px_rgba(0,0,0,.55)]">
      <div className="flex h-12 items-center border-b border-white/10 px-4">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <span className="ml-4 text-[10px] font-bold tracking-[0.2em] text-white/35 uppercase">
          Painel da academia
        </span>
        <ShieldCheck className="ml-auto h-4 w-4 text-red-500" />
      </div>
      <div className="grid min-h-[480px] sm:grid-cols-[145px_1fr]">
        <aside className="hidden border-r border-white/10 p-3 sm:block">
          <div className="mb-5 flex items-center gap-2 px-2 pt-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-black">
              EO
            </div>
            <div>
              <p className="text-[10px] font-bold">Equipe Origem</p>
              <p className="text-[8px] text-white/30">Campinas, SP</p>
            </div>
          </div>
          {["Visão geral", "Alunos", "Presença", "Financeiro", "Graduações"].map(
            (item, i) => (
              <div
                key={item}
                className={`mb-1 rounded-lg px-3 py-2.5 text-[10px] ${i === 0 ? "bg-red-600 font-bold text-white" : "text-white/35"}`}
              >
                {item}
              </div>
            ),
          )}
        </aside>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold tracking-[0.18em] text-red-500 uppercase">
                Hoje no tatame
              </p>
              <h3 className="mt-2 text-xl font-black">Boa noite, Professor.</h3>
              <p className="mt-1 text-[10px] text-white/35">Terça-feira, 8 de setembro</p>
            </div>
            <div className="rounded-lg border border-white/10 px-3 py-2 text-right">
              <p className="text-[8px] text-white/30">Alunos ativos</p>
              <p className="text-sm font-black">128</p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2">
            {[
              ["33", "Confirmados"],
              ["06", "Aulas hoje"],
              ["04", "Pendências"],
            ].map(([value, label], i) => (
              <div
                key={label}
                className={`rounded-xl border p-3 ${i === 0 ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-white/[0.025]"}`}
              >
                <strong className="text-lg font-black">{value}</strong>
                <p className="mt-1 text-[8px] text-white/35">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold">Próximas aulas</span>
              <span className="text-[8px] text-red-500">Ver agenda</span>
            </div>
            <div className="space-y-2">
              {rows.map(([time, name, confirmed, width]) => (
                <div key={time} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] font-bold">{time}</span>
                      <span className="text-[9px] text-white/55">{name}</span>
                    </div>
                    <span className="text-[8px] text-white/30">{confirmed}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-red-600" style={{ width: `${width}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhonePreview() {
  const students = ["Ana", "Marina", "Thiago"];
  return (
    <div className="relative mx-auto w-full max-w-[390px]">
      <div className="absolute inset-8 rounded-full bg-red-600/20 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-[42px] border-[7px] border-[#282828] bg-[#f6f6f4] p-3 text-[#111] shadow-[0_40px_100px_rgba(0,0,0,.65)]"
      >
        <div className="absolute top-3 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#181818]" />
        <div className="overflow-hidden rounded-[31px] bg-white">
          <div className="bg-[#0c0c0c] px-6 pt-12 pb-7 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.18em] text-red-500 uppercase">
                  Próximo treino
                </p>
                <p className="mt-2 text-lg font-black">Adultos Gi</p>
              </div>
              <BeltMark />
            </div>
            <div className="mt-7 flex items-end justify-between">
              <p className="font-mono text-4xl font-black tracking-[-0.06em]">19:30</p>
              <p className="pb-1 text-[9px] text-white/35">75 minutos</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-[10px] font-bold tracking-[0.16em] text-black/35 uppercase">
              Terça-feira, hoje
            </p>
            <div className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-200">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar que vou
            </div>
            <div className="mt-7 flex items-center justify-between">
              <span className="text-xs font-bold">Quem vai treinar</span>
              <span className="text-[10px] text-red-600">3 confirmados</span>
            </div>
            <div className="mt-4 flex -space-x-2">
              {students.map((name, i) => (
                <div
                  key={name}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white ${i === 0 ? "bg-red-600" : i === 1 ? "bg-[#222]" : "bg-[#777]"}`}
                >
                  {name[0]}
                </div>
              ))}
              <div className="ml-3 flex items-center text-[10px] text-black/40">
                Ana, Marina e Thiago
              </div>
            </div>
            <div className="mt-7 rounded-xl bg-[#f1f1ef] p-4">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold">Frequência em setembro</span>
                <span className="font-black text-red-600">82%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/8">
                <div className="h-full w-[82%] rounded-full bg-red-600" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
