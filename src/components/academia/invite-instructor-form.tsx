"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureBrowserAuthSession } from "@/lib/supabase/session";
import { waHref } from "@/lib/whatsapp";

export function InviteInstructorForm() {
  const store = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ message: string; phone: string } | null>(null);

  const instructors = store.users.filter((user) => user.role === "instructor");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.includes("@")) {
      toast.error("Nome e e-mail do professor.");
      return;
    }
    setBusy(true);
    try {
      if (store.isDemo || !createSupabaseBrowserClient()) {
        store.addInstructor({ name, email, phone });
        toast.success(`${name.trim()} entrou na equipe (demonstração).`);
        setName("");
        setEmail("");
        setPhone("");
        return;
      }
      const client = createSupabaseBrowserClient();
      const token = client ? await ensureBrowserAuthSession(client) : null;
      if (!token) {
        toast.error("Entre de novo para convidar.");
        return;
      }
      const res = await fetch("/api/academia/equipe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        userId?: string;
        message?: string;
        phone?: string;
        linked?: boolean;
      };
      if (!res.ok) {
        toast.error(data.error || "Não convidou agora.");
        return;
      }
      store.addInstructor({ id: data.userId, name, email, phone });
      setInvite({ message: data.message || "", phone: data.phone || phone });
      toast.success(
        data.linked
          ? "Professor vinculado neste login. Ele troca de unidade no painel."
          : "Professor na equipe. Manda o WhatsApp com o link da senha.",
      );
      setName("");
      setEmail("");
      setPhone("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Professores</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O convite vai no WhatsApp com o link para criar a senha. Não depende do e-mail do
        Supabase.
      </p>
      {instructors.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {instructors.map((user) => (
            <li key={user.id}>
              {user.name}
              <span className="text-muted-foreground"> · {user.email}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nenhum professor além do dono.</p>
      )}
      <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(e) => void submit(e)}>
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
        <Button type="submit" className="sm:col-span-3" disabled={busy}>
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
    </section>
  );
}
