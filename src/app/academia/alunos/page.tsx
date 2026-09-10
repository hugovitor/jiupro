"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlunoAppCard } from "@/components/academia/aluno-app-card";
import { SendStudentAccessButton } from "@/components/academia/send-student-access";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { beltsForDivision } from "@/lib/belts";
import { formatCpf } from "@/lib/cpf";
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

      <AlunoAppCard />

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
              <TableHead>App</TableHead>
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
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-muted-foreground">
                        {s.userId ? "Já criou senha" : "Ainda sem senha"}
                      </span>
                      <SendStudentAccessButton student={s} />
                    </div>
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
  const [saved, setSaved] = useState<{ name: string; phone: string; email: string } | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    guardianName: "",
    division: "adult" as Student["division"],
    belt: "white",
    monthlyFee: "180",
    cpf: "",
  });

  const belts = beltsForDivision(form.division);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("novo") === "1") setOpen(true);
  }, []);

  function close() {
    setOpen(false);
    setSaved(null);
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Novo aluno
      </Button>
      <FormDialog open={open} onClose={close} title={saved ? "Mandar o acesso" : "Cadastrar aluno"}>
        {saved ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A ficha de {saved.name} já está nesta academia. Manda o WhatsApp para ele confirmar
              o nome da academia e criar a senha. Se ainda não tiver WhatsApp, o aluno busca o nome da
              academia no app e se cadastra sozinho.
            </p>
            {saved.phone.trim() ? (
              <SendStudentAccessButton
                student={{
                  name: saved.name,
                  phone: saved.phone,
                  email: saved.email,
                  userId: "",
                }}
                size="default"
                className="w-full"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem WhatsApp nesta ficha. Peça para {saved.name} abrir o app e buscar{" "}
                {store.academy.name}.
              </p>
            )}
            <Button type="button" variant="outline" className="w-full" onClick={close}>
              Pronto
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              A ficha fica nesta academia. Com WhatsApp, você manda o acesso na hora. Sem ficha, o
              aluno busca o nome da academia no app e entra na lista sozinho.
            </p>
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name.trim()) {
                  toast.error("Nome é obrigatório.");
                  return;
                }
                if (form.division === "kids" && !form.guardianName.trim()) {
                  toast.error("No kids, informe o responsável (LGPD, art. 14).");
                  return;
                }
                store.addStudent({
                  name: form.name.trim(),
                  email: form.email,
                  phone: form.phone,
                  guardianName: form.guardianName.trim() || undefined,
                  birthDate: "2000-01-01",
                  division: form.division,
                  belt: form.belt as Student["belt"],
                  stripes: 0,
                  joinDate: isoDate(0),
                  lastPromotionDate: isoDate(0),
                  status: "active",
                  monthlyFee: Number(form.monthlyFee) || 0,
                  notes: "",
                  cpf: form.cpf.replace(/\D/g, ""),
                });
                toast.success(`${form.name.trim()} entrou na academia.`);
                setSaved({
                  name: form.name.trim(),
                  phone: form.phone,
                  email: form.email,
                });
                setForm({
                  name: "",
                  email: "",
                  phone: "",
                  guardianName: "",
                  division: "adult",
                  belt: "white",
                  monthlyFee: "180",
                  cpf: "",
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
                  <Label>WhatsApp</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Para mandar o acesso"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Turma</Label>
                  <NativeSelect
                    value={form.division}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        division: e.target.value as Student["division"],
                        belt: "white",
                      })
                    }
                  >
                    <option value="adult">Adulto</option>
                    <option value="kids">Kids</option>
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label>Faixa</Label>
                  <NativeSelect
                    value={form.belt}
                    onChange={(e) => setForm({ ...form, belt: e.target.value })}
                  >
                    {belts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              {form.division === "kids" ? (
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Input
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    placeholder="Nome de quem autoriza o cadastro"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dado de menor só com consentimento do responsável.
                  </p>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label>CPF do pagador</Label>
                <Input
                  value={formatCpf(form.cpf)}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Opcional. No kids, use o CPF do responsável, não o da criança.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Mensalidade (R$)</Label>
                <Input
                  type="number"
                  value={form.monthlyFee}
                  onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                />
              </div>
              <Button type="submit">Salvar ficha</Button>
            </form>
          </>
        )}
      </FormDialog>
    </>
  );
}
