"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FormDialog } from "@/components/form-dialog";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, currentMonth, isoDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { dayCode } from "@/lib/whatsapp";

export default function PresencaPage() {
  const store = useStore();
  const today = isoDate(0);
  const classes = store.todayClasses();
  const [classId, setClassId] = useState(classes[0]?.id ?? store.classes[0]?.id);
  const [q, setQ] = useState("");

  const cls = store.classes.find((c) => c.id === classId);
  const students = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return store.students.filter((s) => {
      if (s.status === "inactive") return false;
      if (cls?.division === "kids" && s.division !== "kids") return false;
      if (cls?.division === "adult" && s.division !== "adult") return false;
      if (
        needle &&
        !s.name.toLowerCase().includes(needle) &&
        !s.phone.includes(q.trim())
      ) {
        return false;
      }
      return true;
    });
  }, [store.students, cls, q]);

  const presentIds = new Set(
    store.attendance
      .filter((a) => a.classId === classId && a.date === today)
      .map((a) => a.studentId),
  );
  const visitors = (store.dropIns ?? []).filter(
    (d) => d.classId === classId && d.date === today,
  );
  const heads = presentIds.size + visitors.length;
  const cap = cls?.capacity ?? 0;
  const full = cap > 0 && heads >= cap;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Presença</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chamada de hoje. Visitante paga aula avulsa na porta.
          </p>
        </div>
        <Visitante classId={classId} />
      </div>

      <div className="border border-primary/50 bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">Código do dia</p>
        <p className="mt-1 font-display text-5xl tracking-[0.2em] text-primary">
          {dayCode(today, store.academy.slug)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Anote no quadro. O aluno confirma no PWA com este número.
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="border border-border bg-card p-4 text-sm text-muted-foreground">
          Não há turma na grade para hoje. Você ainda pode lançar em qualquer
          horário da semana.
        </p>
      ) : (
        <p className="text-sm text-primary">
          {classes.length} turma(s) hoje na grade.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(classes.length ? classes : store.classes).map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={classId === c.id ? "default" : "outline"}
            onClick={() => setClassId(c.id)}
          >
            {c.name} {c.startTime}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${full ? "text-destructive" : "text-muted-foreground"}`}>
          {heads} no tatame
          {cap ? ` · vaga ${Math.max(0, cap - heads)} de ${cap}` : ""}
          {full ? " · lotou" : ""}
        </p>
        <Input
          className="sm:max-w-xs"
          placeholder="Buscar na chamada"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {visitors.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Visitantes</h2>
          {visitors.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between border border-primary/40 bg-card p-3 text-sm"
            >
              <span>
                {v.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  aula avulsa · {brl(v.amount)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">Presente</span>
            </div>
          ))}
        </section>
      )}

      <div className="space-y-2">
        {students.map((s) => {
          const here = presentIds.has(s.id);
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 border border-border bg-card p-3"
            >
              <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
              </div>
              <Button
                size="sm"
                variant={here ? "secondary" : "default"}
                onClick={() => {
                  if (here) {
                    toast.message("Já está na lista de hoje.");
                    return;
                  }
                  store.checkIn(s.id, classId, "manual");
                  toast.success(`${s.name} presente.`);
                }}
              >
                {here ? "Presente" : "Marcar"}
              </Button>
            </div>
          );
        })}
      </div>

      <FrequenciaMes />
    </div>
  );
}

function Visitante({ classId }: { classId: string }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const fee = store.academy.dropInFee || 40;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Visitante
      </Button>
      <FormDialog open={open} onClose={() => setOpen(false)} title="Aula avulsa">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            store.addDropIn({
              name: name.trim(),
              phone,
              classId,
              date: isoDate(0),
              amount: fee,
              method: "pix",
            });
            toast.success(`${name.trim()} na lista · ${brl(fee)} Pix.`);
            setOpen(false);
            setName("");
            setPhone("");
          }}
        >
          <p className="text-sm text-muted-foreground">
            Quem veio de outra academia. Taxa da casa: {brl(fee)}.
          </p>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="submit">Marcar e lançar Pix</Button>
        </form>
      </FormDialog>
    </>
  );
}

function FrequenciaMes() {
  const store = useStore();
  const month = currentMonth();
  const rows = store.students
    .filter((s) => s.status !== "inactive")
    .map((s) => ({
      s,
      n: store.attendance.filter((a) => a.studentId === s.id && a.date.startsWith(month))
        .length,
    }))
    .sort((a, b) => b.n - a.n);

  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl">Frequência do mês</h2>
      {rows.map(({ s, n }) => (
        <div key={s.id} className="flex items-center justify-between text-sm">
          <span>{s.name}</span>
          <span className={n === 0 ? "text-destructive" : "text-muted-foreground"}>
            {n} treino{n === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </section>
  );
}
