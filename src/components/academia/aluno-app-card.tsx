"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateJoinCode, studentJoinUrl } from "@/lib/join-code";
import { studentAppInviteHref } from "@/lib/student-join";
import { DEMO_ACADEMY_ID } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";
import { PRODUCT_NAME } from "@/lib/brand";

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
      <h2 className="mt-2 text-lg font-black tracking-tight">Só entra nesta casa</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Manda o link no grupo. O aluno vê o nome da {store.academy.name} e confirma antes de criar
        a senha. Não existe lista de academias — quem não tem o código não cai em outra casa.
      </p>
      <p className="mt-4 font-mono text-3xl font-black tracking-[0.2em]">{code}</p>
      <p className="mt-2 break-all text-xs text-muted-foreground">{link}</p>
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
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          render={
            <a
              href={supportWhatsAppHref(
                `Olá, um aluno não está achando a ${store.academy.name} no app do ${PRODUCT_NAME}.`,
              )}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          Aluno não achou a casa
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Se você já cadastrou a ficha, o aluno usa o mesmo e-mail ou WhatsApp e puxa os dados
        dele. Senão, a ficha nasce nesta academia na hora. Dúvida? WhatsApp {SUPPORT_PHONE_DISPLAY}.
      </p>
    </section>
  );
}
