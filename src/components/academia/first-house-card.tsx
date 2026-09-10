"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Copy, GraduationCap, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openFirstLoginGuide } from "@/lib/first-login";
import { studentJoinUrl } from "@/lib/join-code";
import { studentAppInviteHref } from "@/lib/student-join";
import { useStore } from "@/lib/store";

export function FirstHouseCard() {
  const store = useStore();
  const code = store.academy.joinCode || store.academy.slug.toUpperCase();
  const link = studentJoinUrl(code);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-red-600/25 bg-gradient-to-b from-red-600/12 to-white/[0.03] p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
        Academia nova
      </p>
      <h2 className="mt-2 text-xl font-black tracking-tight">Primeiro aluno</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Cadastre a ficha e mande o WhatsApp para criar a senha. Ou deixe o aluno buscar{" "}
        {store.academy.name} no app — a ficha aparece aqui.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" render={<Link href="/academia/alunos?novo=1" />}>
          <UserPlus className="size-3.5" />
          Cadastrar aluno
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            toast.success("Link do app copiado.");
          }}
        >
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
        <Button size="sm" variant="ghost" onClick={openFirstLoginGuide}>
          <GraduationCap className="size-3.5" />
          Abrir assistente
        </Button>
      </div>
    </section>
  );
}
