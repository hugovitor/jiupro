"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADULT_BELTS, KIDS_BELTS } from "@/lib/belts";
import { brl, currentMonth, isoDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Student, StudentStatus } from "@/lib/types";

const STATUS: { id: StudentStatus | "all" | "overdue"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "trial", label: "Experimental" },
  { id: "overdue", label: "Em atraso" },
  { id: "inactive", label: "Inativos" },
];

export default function AlunosPage() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StudentStatus | "all" | "overdue">("all");
  const month = currentMonth();

  const rows = useMemo(() => {
    return store.students.filter((s) => {
      if (status === "overdue") {
        const late = store.payments.some(
          (p) => p.studentId === s.id && p.status === "overdue",
        );
        if (!late) return false;
      } else if (status !== "all" && s.status !== status) {
        return false;
      }
      if (
        q &&
        !s.name.toLowerCase().includes(q.toLowerCase()) &&
        !s.phone.includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [store.students, store.payments, q, status]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl">Alunos</h1>
          <p className="text-sm text-muted-foreground">
            {store.students.length} cadastros · {store.students.filter((s) => s.status === "active").length} no tatame
          </p>
        </div>
        <NovoAluno />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar nome ou WhatsApp"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {STATUS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={status === s.id ? "default" : "outline"}
              onClick={() => setStatus(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Faixa</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const pay = store.payments.find(
                (p) => p.studentId === s.id && p.month === month,
              );
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/academia/alunos/${s.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
                      <span>
                        <span className="block font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.division === "kids" ? "Kids" : "Adulto"}
                          {s.guardianName ? ` · ${s.guardianName}` : ""}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <BeltBadge belt={s.belt} stripes={s.stripes} compact />
                  </TableCell>
                  <TableCell>{s.monthlyFee ? brl(s.monthlyFee) : "Isento"}</TableCell>
                  <TableCell>
                    <PayPill status={pay?.status} />
                  </TableCell>
                  <TableCell className="capitalize">
                    {s.status === "active"
                      ? "Ativo"
                      : s.status === "trial"
                        ? "Experimental"
                        : "Inativo"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PayPill({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    paid: { label: "Pago", className: "text-foreground" },
    overdue: { label: "Atraso", className: "text-destructive" },
    pending: { label: "Aberto", className: "text-primary" },
    waived: { label: "Isento", className: "text-muted-foreground" },
  };
  const m = map[status ?? ""] ?? { label: "—", className: "text-muted-foreground" };
  return <span className={m.className}>{m.label}</span>;
}

function NovoAluno() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    division: "adult" as Student["division"],
    belt: "white",
    monthlyFee: "180",
  });

  const belts = form.division === "kids" ? KIDS_BELTS : ADULT_BELTS;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Novo aluno
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Cadastrar aluno"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Nome é obrigatório.");
              return;
            }
            store.addStudent({
              name: form.name.trim(),
              email: form.email,
              phone: form.phone,
              birthDate: "2000-01-01",
              division: form.division,
              belt: form.belt as Student["belt"],
              stripes: 0,
              joinDate: isoDate(0),
              lastPromotionDate: isoDate(0),
              status: "active",
              monthlyFee: Number(form.monthlyFee) || 0,
              notes: "",
            });
            toast.success(`${form.name} entrou na academia.`);
            setOpen(false);
            setForm({
              name: "",
              email: "",
              phone: "",
              division: "adult",
              belt: "white",
              monthlyFee: "180",
            });
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Turma</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={form.division}
                onChange={(e) =>
                  setForm({
                    ...form,
                    division: e.target.value as Student["division"],
                    belt: e.target.value === "kids" ? "grey" : "white",
                  })
                }
              >
                <option value="adult">Adulto</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Faixa</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={form.belt}
                onChange={(e) => setForm({ ...form, belt: e.target.value })}
              >
                {belts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mensalidade (R$)</Label>
            <Input
              type="number"
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
            />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </FormDialog>
    </>
  );
}
