"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateJoinCode, studentJoinUrl } from "@/lib/join-code";
import { studentAppInviteHref } from "@/lib/student-join";
import { hasFeature } from "@/lib/plan-access";
import { DEMO_ACADEMY_ID } from "@/lib/seed";
import { useStore } from "@/lib/store";

export function AlunoAppCard() {
  const store = useStore();
  const code = store.academy.joinCode || store.academy.slug.toUpperCase();
  const link = studentJoinUrl(code);

  const needsCode = !store.academy.joinCode && store.academy.id !== DEMO_ACADEMY_ID;
  const updateAcademy = store.updateAcademy;

  useEffect(() => {
    if (needsCode) updateAcademy({ joinCode: generateJoinCode() });
  }, [needsCode, updateAcademy]);

  return (
    <section className="surface p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
        App dos alunos
      </p>
      <h2 className="mt-2 text-lg font-black tracking-tight">Dois jeitos de entrar</h2>
      <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>
          <strong className="text-foreground">Você cadastra.</strong> Salva a ficha e manda o
          WhatsApp. O aluno confirma o nome da {store.academy.name} e cria a senha.
        </li>
        <li>
          <strong className="text-foreground">O aluno se cadastra.</strong> Ele busca o nome da
          academia no app. A ficha nasce nesta academia.
        </li>
        {hasFeature(store.academy, "pwa") ? (
          <li>
            <strong className="text-foreground">Instalar na tela inicial.</strong> No perfil do
            aluno, o app pede para gravar o atalho — funciona offline na agenda.
          </li>
        ) : (
          <li>
            <strong className="text-foreground">App instalável.</strong> Entra no plano Academia:
            o aluno grava o atalho na tela inicial.
          </li>
        )}
        {hasFeature(store.academy, "academyBrand") ? (
          <li>
            <strong className="text-foreground">Marca da casa.</strong> O topo do app, a aba e o
            atalho usam o logo e o nome da {store.academy.name}.
          </li>
        ) : (
          <li>
            <strong className="text-foreground">Marca da academia.</strong> No Equipe o aluno vê
            o logo da casa, não só o TatameX.
          </li>
        )}
      </ol>
      <p className="mt-4 break-all text-xs text-muted-foreground">{link}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            toast.success("Link copiado.");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar link do grupo
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
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp do grupo
          </Button>
        ) : null}
      </div>
    </section>
  );
}
