"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";
import {
  confirmPasswordReset,
  establishRecoverySession,
} from "@/lib/supabase/sync";
import { rememberPassword } from "@/lib/vault";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pr-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-red-500 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-600/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function AtualizarSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [bootError, setBootError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void establishRecoverySession().then((result) => {
      if (cancelled) return;
      if ("error" in result && result.error) {
        setBootError(result.error);
        return;
      }
      setEmail(result.email ?? "");
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa de pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As duas senhas não conferem.");
      return;
    }
    setBusy(true);
    try {
      const result = await confirmPasswordReset(password);
      if (!("ok" in result)) {
        toast.error(result.error);
        return;
      }
      if (result.email) rememberPassword(result.email, password);
      toast.success("Senha atualizada. Entre com a nova senha.");
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      kicker="Acesso"
      title="Nova senha"
      subtitle={
        ready
          ? `Defina a senha nova${email ? ` para ${email}` : ""}. Depois entre no painel.`
          : "Validando o link do e-mail."
      }
      switchHref="/login"
      switchLabel="Voltar ao login"
    >
      {bootError ? (
        <div className="space-y-4 text-sm leading-6 text-white/55">
          <p>{bootError}</p>
          <Link
            href="/recuperar-senha"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-500"
          >
            Pedir outro link
          </Link>
          <a
            href={supportWhatsAppHref("Olá, o link de recuperação de senha do TatameX não funcionou.")}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs font-bold text-red-400 hover:text-red-300"
          >
            WhatsApp {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      ) : !ready ? (
        <p className="flex items-center gap-2 text-sm text-white/45">
          <LoaderCircle className="h-4 w-4 animate-spin text-red-500" />
          Abrindo a recuperação…
        </p>
      ) : (
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold text-white/70">
              Nova senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={busy}
                required
                className={fieldClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-xs font-bold text-white/70">
              Confirmar senha
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
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
                Salvando…
              </>
            ) : (
              <>
                Salvar senha
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthScreen>
  );
}
