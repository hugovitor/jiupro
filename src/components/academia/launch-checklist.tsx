"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { currentMonth } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LaunchChecklist() {
  const store = useStore();
  if (store.isDemo) return null;

  const month = currentMonth();
  const steps = [
    {
      id: "pix",
      label: "Colocar a chave Pix da academia",
      hint: "A mensalidade do aluno vai no WhatsApp, com a sua chave.",
      href: "/academia/configuracoes",
      done: Boolean(store.academy.pixKey.trim()),
    },
    {
      id: "class",
      label: "Conferir a grade da semana",
      hint: "Com a turma no horário, o aluno confirma no celular.",
      href: "/academia/turmas",
      done: store.classes.length > 0,
    },
    {
      id: "student",
      label: "Cadastrar o primeiro aluno",
      hint: "Ficha na lista, ou o aluno busca o nome da academia no app.",
      href: "/academia/alunos?novo=1",
      done: store.students.length > 0,
    },
    {
      id: "charge",
      label: "Gerar as mensalidades do mês",
      hint: "Depois é WhatsApp + baixar Pix quando cair.",
      href: "/academia/cobrancas",
      done: store.payments.some((p) => p.month === month),
    },
  ];
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-red-600/25 bg-gradient-to-b from-red-600/12 to-white/[0.03] p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
        Começar a operar
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-black tracking-tight">Quatro passos e a academia roda</h2>
        <p className="text-xs font-bold text-white/50">
          {done}/{steps.length}
        </p>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-3 transition",
                step.done
                  ? "border-white/8 bg-white/[0.03] text-white/45"
                  : "border-white/12 bg-black/20 hover:border-red-500/40 hover:bg-red-600/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                  step.done ? "bg-emerald-500/20 text-emerald-400" : "bg-red-600 text-white",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : <Circle className="size-3.5 fill-current" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  {index + 1}. {step.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{step.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
