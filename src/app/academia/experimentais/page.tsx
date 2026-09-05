"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, isoDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { trialMessage, waHref } from "@/lib/whatsapp";
import type { Student } from "@/lib/types";

export default function ExperimentaisPage() {
  const store = useStore();
  const trials = store.students.filter((s) => s.status === "trial");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Experimentais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quem veio treinar uma vez. Converter antes de esfriar.
          </p>
        </div>
        <NovoExperimental />
      </div>

      {trials.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum experimental aberto.</p>
      )}

      <div className="space-y-2">
        {trials.map((s) => (
          <article
            key={s.id}
            className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <PersonAvatar name={s.name} hue={s.avatarHue} />
            <div className="min-w-0 flex-1">
              <Link href={`/academia/alunos/${s.id}`} className="font-medium hover:underline">
                {s.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {s.phone}
                {s.guardianName ? ` · resp. ${s.guardianName}` : ""} ·{" "}
                {brl(s.monthlyFee)}/mês se fechar
              </p>
              {s.notes && (
                <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                render={
                  <a
                    href={waHref(s.phone, trialMessage(store.academy, s))}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  store.updateStudent(s.id, { status: "active" });
                  toast.success(`${s.name} virou mensalista.`);
                }}
              >
                Converter
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function NovoExperimental() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState("180");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Nova aula experimental
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Agendar experimental"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            store.addStudent({
              name: name.trim(),
              email: "",
              phone,
              birthDate: "2000-01-01",
              division: "adult",
              belt: "white",
              stripes: 0,
              joinDate: isoDate(0),
              lastPromotionDate: isoDate(0),
              status: "trial",
              monthlyFee: Number(fee) || 180,
              notes: "Aula experimental. Converter esta semana.",
            } satisfies Omit<Student, "id" | "academyId" | "userId" | "avatarHue">);
            toast.success("Experimental na lista.");
            setOpen(false);
            setName("");
            setPhone("");
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mensalidade se fechar</Label>
              <Input value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </FormDialog>
    </>
  );
}
