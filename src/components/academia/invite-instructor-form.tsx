"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitInstructorInvite } from "@/lib/invite-instructor";
import { useStore } from "@/lib/store";
import { waHref } from "@/lib/whatsapp";

function InviteFields({
  onInvited,
  stacked,
}: {
  onInvited?: () => void;
  stacked?: boolean;
}) {
  const store = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ message: string; phone: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await submitInstructorInvite(store, { name, email, phone });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setInvite(result.message ? { message: result.message, phone: result.phone } : null);
      toast.success(
        result.linked
          ? "Professor vinculado neste login. Ele troca de unidade no painel."
          : store.isDemo
            ? `${name.trim()} entrou na equipe. Não aparece na lista de alunos.`
            : "Professor na equipe. Manda o WhatsApp com o link da senha.",
      );
      setName("");
      setEmail("");
      setPhone("");
      onInvited?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form
        className={stacked ? "grid gap-3" : "grid gap-3 sm:grid-cols-3"}
        onSubmit={(e) => void submit(e)}
      >
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11999990000" />
        </div>
        <Button type="submit" className={stacked ? undefined : "sm:col-span-3"} disabled={busy}>
          {busy ? "Convidando…" : "Convidar professor"}
        </Button>
      </form>
      {invite?.message ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {invite.phone ? (
            <Button
              render={
                <a href={waHref(invite.phone, invite.message)} target="_blank" rel="noreferrer" />
              }
            >
              Mandar no WhatsApp
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(invite.message);
              toast.success("Mensagem copiada.");
            }}
          >
            Copiar convite
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function InviteInstructorForm() {
  const store = useStore();
  const instructors = store.users.filter((user) => user.role === "instructor");

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Professores</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O convite vai no WhatsApp com o link para criar a senha. Não depende do e-mail do
        Supabase. Quem entra aqui é professor: não cria ficha de aluno.
      </p>
      {instructors.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm">
          {instructors.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3">
              <span>
                {user.name}
                <span className="text-muted-foreground"> · {user.email}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  const result = await store.removeInstructor(user.id);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(`${user.name.split(" ")[0]} saiu da equipe.`);
                }}
              >
                Tirar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum professor além do dono.</p>
      )}
      <div className="mt-4">
        <InviteFields />
      </div>
    </section>
  );
}

export function InviteInstructorDialog() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Novo professor
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cadastrar professor"
        className="max-w-md"
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Entra na equipe, não na lista de alunos. Depois manda o WhatsApp com o link da senha.
        </p>
        <InviteFields stacked onInvited={() => { if (store.isDemo) setOpen(false); }} />
      </FormDialog>
    </>
  );
}
