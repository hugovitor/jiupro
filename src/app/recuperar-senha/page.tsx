"use client";

import Link from "next/link";
import { AuthScreen } from "@/components/auth-screen";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";

export default function RecuperarSenhaPage() {
  return (
    <AuthScreen
      kicker="Acesso"
      title="Esqueceu a senha?"
      subtitle="Ainda não enviamos e-mail de redefinição. Dono da academia: chame o suporte no WhatsApp. Aluno: fale com a recepção da casa."
      switchHref="/login"
      switchLabel="Voltar ao login"
    >
      <a
        href={supportWhatsAppHref(
          "Olá, sou dono de academia no JiuPro e esqueci a senha.",
        )}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white hover:bg-red-500"
      >
        WhatsApp {SUPPORT_PHONE_DISPLAY}
      </a>
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
