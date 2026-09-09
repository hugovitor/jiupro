"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/supabase/sync";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pr-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const needle = email.trim().toLowerCase();
    if (!needle.includes("@")) {
      toast.error("Informe o e-mail da conta.");
      return;
    }
    if (DEMO_ACCOUNTS.some((account) => account.email === needle)) {
      toast.message("Essa é uma conta de demonstração.", {
        description: "Entre em /login pelos atalhos da Equipe Origem. A senha é demo.",
      });
      return;
    }
    if (!isSupabaseConfigured()) {
      toast.error("Não dá para enviar e-mail agora. Fale no WhatsApp do suporte.");
      return;
    }

    setBusy(true);
    try {
      const result = await requestPasswordReset(needle);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success("Se esse e-mail tiver academia, o link já saiu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      kicker="Acesso"
      title="Esqueceu a senha?"
      subtitle="Enviamos um link para o e-mail da conta. Aluno: se não chegar, fale com a recepção da academia."
      switchHref="/login"
      switchLabel="Voltar ao login"
    >
      {sent ? (
        <div className="space-y-4 text-sm leading-6 text-white/55">
          <p>
            Confira a caixa de entrada e o spam. O link abre a tela para criar a
            senha nova.
          </p>
          <p>
            Não chegou?{" "}
            <a
              className="font-bold text-red-400 hover:text-red-300"
              href={supportWhatsAppHref(
                `Olá, pedi recuperação de senha no Ponteira para ${email.trim().toLowerCase()} e o e-mail não chegou.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp {SUPPORT_PHONE_DISPLAY}
            </a>
          </p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold text-white/70">
              E-mail da conta
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@academia.com.br"
                autoComplete="username"
                disabled={busy}
                required
                className={fieldClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-500 disabled:opacity-65"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                Enviar link
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-white/35">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-extrabold text-white underline decoration-red-600 decoration-2 underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </AuthScreen>
  );
}
