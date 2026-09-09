
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const store = useStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  async function enter(nextEmail = email, nextPassword = password) {
    const normalizedEmail = nextEmail.trim().toLowerCase();

    if (!normalizedEmail || !nextPassword) {
      toast.error("Informe seu e-mail e sua senha.");
      return;
    }

    setBusy(true);

    try {
      const result = await store.login(normalizedEmail, nextPassword);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Acesso autorizado. Bem-vindo ao JiuPro!");
      router.push(result.role === "student" ? "/aluno" : "/academia");
    } catch {
      toast.error("Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
      setActiveDemo(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void enter();
  }

  function openDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setActiveDemo(account.email);
    void enter(account.email, account.password);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-white selection:bg-red-600 selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(220,38,38,0.18),transparent_28%),radial-gradient(circle_at_82%_72%,rgba(255,255,255,0.06),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:74px_74px]" />

      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <BeltMark />
          <div>
            <span className="block text-lg font-black tracking-[-0.04em]">JIUPRO</span>
            <span className="block text-[8px] font-semibold uppercase tracking-[0.32em] text-white/35">
              Gestão no tatame
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar ao início</span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-5 py-10 lg:grid-cols-[1fr_500px] lg:px-8 lg:py-16">
        <div className="hidden max-w-xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-400">
            <Sparkles className="h-3.5 w-3.5" />
            Acesso à sua academia
          </div>

          <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.055em] xl:text-6xl">
            Sua gestão começa
            <span className="mt-2 block text-white/35">antes do treino.</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-white/48">
            Entre no painel da academia ou acesse o aplicativo do aluno. Tudo o que sua equipe precisa, em um só lugar.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              [ShieldCheck, "Acesso protegido", "Sua operação e seus alunos em segurança."],
              [Users, "Equipe conectada", "Gestores, professores e alunos no mesmo fluxo."],
              [GraduationCap, "Evolução registrada", "Frequência, graus e faixas sempre atualizados."],
              [CheckCircle2, "Rotina simplificada", "Menos tarefas manuais antes e depois da aula."],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return (
                <div key={String(title)} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 backdrop-blur-sm">
                  <FeatureIcon className="h-5 w-5 text-red-500" />
                  <p className="mt-3 text-sm font-extrabold">{String(title)}</p>
                  <p className="mt-1 text-xs leading-5 text-white/35">{String(description)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
            <span className="h-px w-10 bg-red-600" />
            Gestão faixa preta
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[500px]">
          <div className="pointer-events-none absolute -inset-8 rounded-full bg-red-600/10 blur-3xl" />

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101010]/95 shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <div className="h-1 w-full bg-gradient-to-r from-red-800 via-red-500 to-red-800" />

            <div className="p-6 sm:p-9">
              <div className="lg:hidden">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                  <span className="h-px w-6 bg-red-600" />
                  Acesso à academia
                </div>
              </div>

              <div className="mt-3 lg:mt-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500">
                  Bem-vindo de volta
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Entre no JiuPro</h2>
                <p className="mt-3 text-sm leading-6 text-white/42">
                  Use os dados da sua conta ou entre rapidamente por um dos acessos de demonstração.
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold text-white/70">
                    E-mail
                  </label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition group-focus-within:text-red-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="username"
                      placeholder="voce@academia.com.br"
                      disabled={busy}
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="password" className="text-xs font-bold text-white/70">
                      Senha
                    </label>
                    <Link href="/recuperar-senha" className="text-[11px] font-bold text-red-500 transition hover:text-red-400">
                      Esqueci minha senha
                    </Link>
                  </div>

                  <div className="group relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition group-focus-within:text-red-500" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      disabled={busy}
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={busy}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-600/25 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {busy ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar na plataforma
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/8" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">Acessos de demonstração</span>
                <span className="h-px flex-1 bg-white/8" />
              </div>

              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map((account, index) => {
                  const opening = activeDemo === account.email;
                  const DemoIcon = index === DEMO_ACCOUNTS.length - 1 ? GraduationCap : Users;

                  return (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => openDemo(account)}
                      disabled={busy}
                      className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-left transition hover:border-red-500/35 hover:bg-red-500/[0.06] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40 transition group-hover:bg-red-600 group-hover:text-white">
                        <DemoIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold text-white/85">{account.label}</span>
                        <span className="mt-1 block truncate text-[10px] text-white/30">{account.hint}</span>
                      </span>
                      {opening ? (
                        <LoaderCircle className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-8 text-center text-xs text-white/35">
                Ainda não possui uma academia?{" "}
                <Link href="/cadastro" className="font-extrabold text-white underline decoration-red-600 decoration-2 underline-offset-4 transition hover:text-red-400">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] leading-5 text-white/20">
            Ao continuar, você concorda com os termos de uso e a política de privacidade do JiuPro.
          </p>
        </div>
      </section>
    </main>
  );
}

function BeltMark() {
  return (
    <span className="relative block h-7 w-11 overflow-hidden rounded-sm bg-[#191919] shadow-inner shadow-black">
      <span className="absolute inset-y-0 right-0 w-3.5 bg-red-600" />
      <span className="absolute right-1 top-1 h-5 w-[2px] bg-white" />
    </span>
  );
}
