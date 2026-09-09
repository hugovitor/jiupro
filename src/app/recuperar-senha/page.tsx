"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Mail } from "lucide-react";
import { AuthScreen } from "@/components/auth-screen";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Informe o e-mail da conta.");
      return;
    }
    toast.message("A recuperação automática ainda não está ligada.", {
      description:
        "Se você é aluno, fale com a academia. Se você é o dono, entre com a senha cadastrada ou abra uma nova conta.",
    });
  }

  return (
    <AuthScreen
      kicker="Acesso"
      title="Esqueceu a senha?"
      subtitle="Ainda não enviamos e-mail de redefinição. Use os atalhos da demonstração ou fale com o dono da casa."
      switchHref="/login"
      switchLabel="Voltar ao login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pr-4 pl-11 text-sm text-white outline-none placeholder:text-white/20 focus:border-red-500 focus:ring-4 focus:ring-red-600/10"
            />
          </div>
        </div>
        <button
          type="submit"
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-500"
        >
          Continuar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
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
