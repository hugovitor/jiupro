"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Copy, GraduationCap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentJoinUrl } from "@/lib/join-code";
import {
  isFirstLoginDone,
  isFirstLoginSkippedThisVisit,
  markFirstLoginDone,
  onOpenFirstLoginGuide,
  openFirstLoginGuide,
  shouldAutoOpenFirstLogin,
  skipFirstLoginThisVisit,
  type FirstLoginIdentity,
} from "@/lib/first-login";
import { isoDate } from "@/lib/format";
import { studentCapMessage } from "@/lib/plan-access";
import { currentStudent, useStore } from "@/lib/store";
import { studentAppInviteHref } from "@/lib/student-join";
import { firstName } from "@/lib/whatsapp";

const fieldClass =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-500";

export function FirstLoginGuide() {
  const store = useStore();
  const router = useRouter();
  const session = store.session;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pixKey, setPixKey] = useState(store.academy.pixKey);
  const [pixName, setPixName] = useState(store.academy.pixName || store.academy.name);
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const role = session?.role ?? "owner";
  const steps =
    role === "student" ? STUDENT_STEPS : role === "instructor" ? INSTRUCTOR_STEPS : OWNER_STEPS;
  const last = steps.length - 1;
  const student = currentStudent(store);
  const joinCode = store.academy.joinCode || store.academy.slug;
  const joinLink = studentJoinUrl(joinCode);
  const dismissedRef = useRef(false);
  const email =
    store.users.find((user) => user.id === session?.userId)?.email || student?.email || "";
  const identity: FirstLoginIdentity | null = session
    ? { userId: session.userId, email, academyId: store.academy.id }
    : null;

  function closeModal() {
    setOpen(false);
    setStep(0);
  }

  function closeThisVisit() {
    dismissedRef.current = true;
    skipFirstLoginThisVisit();
    closeModal();
  }

  function closeForever() {
    dismissedRef.current = true;
    skipFirstLoginThisVisit();
    if (identity) markFirstLoginDone(identity);
    closeModal();
  }

  useEffect(() => {
    return onOpenFirstLoginGuide(() => {
      dismissedRef.current = false;
      setPixKey(store.academy.pixKey);
      setPixName(store.academy.pixName || store.academy.name);
      setStep(0);
      setOpen(true);
    });
  }, [store.academy.pixKey, store.academy.pixName, store.academy.name]);

  useEffect(() => {
    if (!session) return;
    const forced = new URLSearchParams(window.location.search).get("guia") === "1";
    if (!forced) {
      if (dismissedRef.current) return;
      if (store.isDemo) return;
      if (isFirstLoginSkippedThisVisit()) return;
      if (isFirstLoginDone({ userId: session.userId, email, academyId: store.academy.id })) return;
      if (
        !shouldAutoOpenFirstLogin({
          isDemo: store.isDemo,
          role: session.role,
          studentCount: store.students.length,
          hasPix: Boolean(store.academy.pixKey.trim()),
        })
      ) {
        return;
      }
    }
    const timer = window.setTimeout(() => setOpen(true), forced ? 200 : 450);
    return () => window.clearTimeout(timer);
  }, [email, session?.role, session?.userId, store.academy.id, store.academy.pixKey, store.isDemo, store.students.length]);

  if (!open || !session) return null;

  const current = steps[step];

  async function copyLink() {
    await navigator.clipboard.writeText(joinLink);
    toast.success("Link do app copiado.");
  }

  function savePixAndNext() {
    const key = pixKey.trim();
    if (!key) {
      toast.error("Cole a chave Pix da academia.");
      return;
    }
    store.updateAcademy({ pixKey: key, pixName: pixName.trim() || store.academy.name });
    toast.success("Pix da academia salvo.");
    setStep((n) => n + 1);
  }

  function saveFirstStudent() {
    if (!studentName.trim()) {
      toast.error("Informe o nome do aluno.");
      return;
    }
    if (!store.addStudent({
      name: studentName.trim(),
      email: studentEmail.trim(),
      phone: studentPhone.trim(),
      birthDate: "2000-01-01",
      division: "adult",
      belt: "white",
      stripes: 0,
      joinDate: isoDate(0),
      lastPromotionDate: isoDate(0),
      status: "active",
      monthlyFee: 180,
      notes: "",
    })) {
      toast.error(studentCapMessage(store.academy));
      return;
    }
    toast.success(`${studentName.trim()} entrou na ficha desta academia.`);
    setStudentName("");
    setStudentPhone("");
    setStudentEmail("");
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-login-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0c0c0c] shadow-[0_30px_80px_rgba(0,0,0,.65)] sm:rounded-3xl"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.22),transparent_70%)]" />
        <div className="relative border-b border-white/10 px-5 pt-5 pb-4">
          <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Assistente · {step + 1} de {steps.length}
          </p>
          <h2 id="first-login-title" className="mt-2 text-2xl font-black tracking-tight">
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{current.body}</p>
          <div className="mt-4 flex gap-1.5">
            {steps.map((item, index) => (
              <span
                key={item.id}
                className={
                  index <= step ? "h-1 flex-1 rounded-full bg-red-600" : "h-1 flex-1 rounded-full bg-white/10"
                }
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {role === "owner" && current.id === "pix" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Chave Pix</Label>
                <Input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="CPF, e-mail, celular ou aleatória"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome no Pix</Label>
                <Input
                  value={pixName}
                  onChange={(e) => setPixName(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
          ) : null}

          {role === "owner" && current.id === "alunos" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-mono text-2xl font-black tracking-[0.18em]">{joinCode.toUpperCase()}</p>
                <p className="mt-2 break-all text-xs text-white/40">{joinLink}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void copyLink()}>
                    <Copy className="size-3.5" />
                    Copiar link
                  </Button>
                  {store.academy.phone ? (
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <a
                          href={studentAppInviteHref(store.academy, store.academy.phone)}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-white/40">
                Quer cadastrar a ficha agora? O aluno depois cria a senha no mesmo e-mail ou
                WhatsApp.
              </p>
              <div className="space-y-2">
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nome do aluno"
                  className={fieldClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="WhatsApp"
                    className={fieldClass}
                  />
                  <Input
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="E-mail"
                    className={fieldClass}
                  />
                </div>
                <Button size="sm" variant="secondary" onClick={saveFirstStudent}>
                  Cadastrar nesta academia
                </Button>
              </div>
            </div>
          ) : null}

          {role === "student" && current.id === "casa" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-lg font-black tracking-tight">{store.academy.name}</p>
              <p className="mt-1 text-sm text-white/45">
                {[store.academy.city, store.academy.state].filter(Boolean).join("/")}
              </p>
              {student ? (
                <p className="mt-3 text-sm text-white/60">
                  Olá, {firstName(student.name)}. Sua ficha já está nesta academia.
                </p>
              ) : null}
            </div>
          ) : null}

          {current.tips ? (
            <ul className="mt-4 space-y-2">
              {current.tips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 text-sm leading-relaxed text-white/55"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-red-500" />
                  {tip}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="relative flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row sm:items-center">
          <div className="order-2 flex flex-col gap-1 sm:order-1 sm:mr-auto">
            <button
              type="button"
              className="text-center text-sm font-bold text-white/70 hover:text-white sm:text-left"
              onClick={() => {
                closeForever();
                toast.success(
                  role === "student"
                    ? "Assistente desligado. Abre de novo em Perfil se quiser."
                    : "Assistente desligado. Abre de novo em Configurações se quiser.",
                );
              }}
            >
              Não mostrar mais
            </button>
            <button
              type="button"
              className="text-center text-xs font-bold text-white/35 hover:text-white sm:text-left"
              onClick={closeThisVisit}
            >
              Agora não
            </button>
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            {step > 0 ? (
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setStep((n) => n - 1)}>
                Voltar
              </Button>
            ) : null}
            {role === "owner" && current.id === "pix" ? (
              <Button className="h-11 flex-1" onClick={savePixAndNext}>
                Salvar Pix
                <ArrowRight className="size-4" />
              </Button>
            ) : step === last ? (
              <Button
                className="h-11 flex-1"
                onClick={() => {
                  closeForever();
                  if (role === "student") router.push("/aluno");
                  else if (current.id === "pronto") router.push("/academia");
                }}
              >
                Começar
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button className="h-11 flex-1" onClick={() => setStep((n) => n + 1)}>
                Continuar
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type Step = {
  id: string;
  title: string;
  body: string;
  tips?: string[];
};

const OWNER_STEPS: Step[] = [
  {
    id: "ola",
    title: "Três coisas e a academia roda.",
    body: "Pix para a mensalidade, o primeiro aluno e a presença na aula. Você cadastra a turma ou o aluno encontra a academia pelo nome.",
    tips: [
      "Este painel é só da sua academia.",
      "Alunos pagam no Pix da academia. O cartão é da assinatura do TatameX.",
    ],
  },
  {
    id: "pix",
    title: "Cole o Pix da academia.",
    body: "É a chave que o aluno copia na mensalidade. CPF, e-mail, celular ou aleatória.",
  },
  {
    id: "alunos",
    title: "Chame o primeiro aluno.",
    body: "Cadastre a ficha e mande o WhatsApp para criar a senha. Quem ainda não está na lista busca o nome da academia no app e entra sozinho.",
  },
  {
    id: "pronto",
    title: "Na aula: dois toques.",
    body: "O aluno toca em Confirmar que vou. No tatame você aceita quem treinou. Adultos Gi e Kids já vêm na grade — mude em Turmas se quiser.",
    tips: [
      "Cobrança: WhatsApp + Pix da academia.",
      "Faixa usa tempo e presença, não chute.",
    ],
  },
];

const INSTRUCTOR_STEPS: Step[] = [
  {
    id: "ola",
    title: "Você está na operação.",
    body: "Mesmo painel da academia. Sua parte é turma, chamada e graduação.",
  },
  {
    id: "presenca",
    title: "Chamada em duas etapas.",
    body: "O aluno confirma no app. No tatame você valida quem treinou ou marca quem confirmou e não veio. Sem PIN de quadro.",
  },
  {
    id: "pronto",
    title: "Pode ir pro tatame.",
    body: "Alunos, turmas e presença estão no menu de baixo. Se faltar alguém, o painel sugere o Zap de volta.",
  },
];

const STUDENT_STEPS: Step[] = [
  {
    id: "casa",
    title: "Você entrou na sua academia.",
    body: "Este app é da academia que você escolheu. Presença, faixa e Pix da academia ficam aqui.",
  },
  {
    id: "aula",
    title: "Confirma que vai.",
    body: "Em Hoje, na próxima aula, toca em Confirmar que vou. Os colegas já te veem. O professor aceita no tatame.",
    tips: ["Se mudar de ideia, cancela antes da aula.", "Visitante avulso entra pela recepção, não por aqui."],
  },
  {
    id: "faixa",
    title: "Faixa e frequência.",
    body: "Em Faixa você vê tempo, presenças e o que falta para a próxima. Quem decide é o professor.",
  },
  {
    id: "pix",
    title: "Mensalidade no Pix da academia.",
    body: "Em Perfil está o valor do mês. Copia o Pix da academia — não é pagamento do TatameX.",
  },
];

export function FirstLoginHint({
  className,
  label = "Abrir assistente",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={openFirstLoginGuide}>
      <GraduationCap className="size-3.5" />
      {label}
    </Button>
  );
}
