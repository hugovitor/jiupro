"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormDialog } from "@/components/form-dialog";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  attendanceStatus,
  classHeadcount,
  classPhase,
  habitualStudentIds,
  isLateCheckIn,
  isOnRoster,
  isOverdue,
  isValidated,
  methodLabel,
  phaseHint,
  phaseLabel,
  recommendClass,
  sortByName,
  statusLabel,
} from "@/lib/attendance";
import { brl, clockLabel, currentMonth, formatTime, isoDate, minutes, weekdayName } from "@/lib/format";
import { attendanceDay, attendanceForStudent, classesShareSlot } from "@/lib/roster-identity";
import { useStore } from "@/lib/store";
import type { Attendance, ClassSession, Student } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

export default function PresencaPage() {
  const store = useStore();
  const now = useNow();
  const today = isoDate(0);

  useEffect(() => {
    void store.pullNow().catch(() => undefined);
    const tick = window.setInterval(() => {
      void store.pullNow().catch(() => undefined);
    }, 5000);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void store.pullNow().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [store.pullNow]);

  const todayList = useMemo(() => {
    const byDay = store.todayClasses();
    const withCheckIn = store.classes.filter((cls) =>
      store.attendance.some(
        (row) => row.classId === cls.id && attendanceDay(row.date) === today && isOnRoster(row),
      ),
    );
    const seen = new Map<string, ClassSession>();
    for (const cls of [...byDay, ...withCheckIn]) seen.set(cls.id, cls);
    return [...seen.values()].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  }, [store, today]);
  const recommended = recommendClass(todayList, now);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const waitingClassId = store.classes.find((item) =>
    store.attendance.some((row) => {
      if (attendanceDay(row.date) !== today || attendanceStatus(row) !== "pending") return false;
      if (row.classId === item.id) return true;
      const origin = store.classes.find((cls) => cls.id === row.classId);
      return origin ? classesShareSlot(origin, item) : false;
    }),
  )?.id;

  const classId =
    pinnedId ??
    waitingClassId ??
    recommended?.id ??
    todayList[0]?.id ??
    store.classes[0]?.id ??
    "";
  const cls = store.classes.find((c) => c.id === classId);
  const phase = cls ? classPhase(cls, now) : "closed";
  const classIds = new Set(
    store.classes.filter((item) => cls && classesShareSlot(item, cls)).map((item) => item.id),
  );
  if (cls) classIds.add(cls.id);

  const roster = useMemo(() => {
    return store.students.filter((s) => {
      if (s.status === "inactive") return false;
      if (cls?.division === "kids" && s.division !== "kids") return false;
      if (cls?.division === "adult" && s.division !== "adult") return false;
      return true;
    });
  }, [store.students, cls]);

  const presentRows = store.attendance.filter(
    (a) => classIds.has(a.classId) && attendanceDay(a.date) === today && isOnRoster(a),
  );
  const presentByStudent = new Map<string, Attendance>();
  for (const student of roster) {
    const row = attendanceForStudent(
      student,
      presentRows,
      store.students,
    );
    if (row) presentByStudent.set(student.id, row);
  }
  const noShowRows = store.attendance.filter(
    (a) =>
      classIds.has(a.classId) &&
      attendanceDay(a.date) === today &&
      attendanceStatus(a) === "no_show",
  );
  const noShowByStudent = new Map<string, Attendance>();
  for (const student of roster) {
    const row = attendanceForStudent(student, noShowRows, store.students);
    if (row) noShowByStudent.set(student.id, row);
  }
  for (const row of presentRows) {
    if ([...presentByStudent.values()].some((att) => att.id === row.id)) continue;
    const student =
      store.students.find((item) => item.id === row.studentId) ??
      store.students.find((item) => item.userId === row.studentId) ??
      ghostStudent(row);
    presentByStudent.set(student.id, row);
  }
  const extraRoster: Student[] = [];
  for (const [id, row] of presentByStudent) {
    if (roster.some((item) => item.id === id)) continue;
    extraRoster.push(
      store.students.find((item) => item.id === id) ?? ghostStudent(row),
    );
  }
  const listed = [...roster, ...extraRoster];
  const habitual = habitualStudentIds(classId, store.attendance);
  const visitors = (store.dropIns ?? []).filter(
    (d) => d.classId === classId && d.date === today,
  );

  const needle = q.trim().toLowerCase();
  function matches(s: Student) {
    if (!needle) return true;
    return (
      s.name.toLowerCase().includes(needle) || s.phone.includes(q.trim())
    );
  }

  const waiting = listed
    .filter(
      (s) =>
        presentByStudent.has(s.id) &&
        attendanceStatus(presentByStudent.get(s.id)!) === "pending" &&
        matches(s),
    )
    .sort(sortByName);
  const validated = listed
    .filter(
      (s) =>
        presentByStudent.has(s.id) &&
        isValidated(presentByStudent.get(s.id)!) &&
        matches(s),
    )
    .sort(sortByName);
  const habitualMissing = roster
    .filter((s) => habitual.has(s.id) && !presentByStudent.has(s.id) && matches(s))
    .sort(sortByName);
  const others = roster
    .filter(
      (s) =>
        !habitual.has(s.id) &&
        !presentByStudent.has(s.id) &&
        !noShowByStudent.has(s.id) &&
        matches(s),
    )
    .sort(sortByName);
  const noShows = roster
    .filter((s) => noShowByStudent.has(s.id) && matches(s))
    .sort(sortByName);

  const heads = classHeadcount(
    store.attendance,
    store.dropIns ?? [],
    classId,
    today,
  );
  const cap = cls?.capacity ?? 0;
  const full = cap > 0 && heads >= cap;
  const open = Math.max(0, cap - heads);
  const todayIds = new Set(todayList.map((c) => c.id));
  const tabs = [...store.classes].sort((a, b) => {
    const todayDelta = Number(todayIds.has(b.id)) - Number(todayIds.has(a.id));
    if (todayDelta) return todayDelta;
    return a.weekday - b.weekday || minutes(a.startTime) - minutes(b.startTime);
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
            {clockLabel(now)} · São Paulo
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Presença</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            O aluno confirma no celular. Você aceita quem treinou e marca quem
            confirmou e não veio — sem código no quadro.
          </p>
        </div>
        <Visitante classId={classId} disabled={!classId} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((c) => {
          const selected = c.id === classId;
          const live = classPhase(c, now);
          const ids = new Set(
            store.classes.filter((item) => classesShareSlot(item, c)).map((item) => item.id),
          );
          ids.add(c.id);
          const n = store.attendance.filter(
            (a) => ids.has(a.classId) && attendanceDay(a.date) === today && isOnRoster(a),
          ).length;
          const pending = store.attendance.filter(
            (a) =>
              ids.has(a.classId) &&
              attendanceDay(a.date) === today &&
              attendanceStatus(a) === "pending",
          ).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setPinnedId(c.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-left text-[13px]",
                selected
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {live === "live" ? (
                <span className="size-1.5 bg-primary" aria-hidden />
              ) : null}
              <span className="font-mono tabular-nums">{c.startTime}</span>
              <span>
                {weekdayName(c.weekday).toUpperCase()} · {c.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {n}
                {pending ? ` · ${pending}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {!cls ? (
        <p className="surface p-4 text-sm text-muted-foreground">
          Cadastre uma turma para abrir a chamada.
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="surface p-5">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Confirmados no app
              </p>
              <p className="mt-3 text-[52px] leading-none font-medium tabular-nums">
                {waiting.length + validated.length}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {waiting.length === 0
                  ? "Ninguém aguardando aceite."
                  : waiting.length === 1
                    ? "1 aluno esperando você no tatame."
                    : `${waiting.length} alunos esperando aceite.`}
                {validated.length
                  ? ` ${validated.length} já validado${validated.length === 1 ? "" : "s"}.`
                  : ""}
              </p>
            </div>
            <div className="surface flex flex-col justify-between p-5">
              <div>
                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  {phaseLabel(phase)}
                </p>
                <p className="mt-2 text-[18px] font-medium">
                  {cls.startTime} · {cls.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cls.gi ? "Gi" : "No-Gi"} · {cls.durationMin} min ·{" "}
                  {phaseHint(cls, now)}
                </p>
              </div>
              {phase === "closed" ? (
                <p className="mt-4 text-[12px] text-muted-foreground">
                  O app já recusa confirmação. Aqui você ainda aceita, recusa e inclui.
                </p>
              ) : recommended?.id === cls.id ? (
                <p className="mt-4 text-[12px] text-muted-foreground">
                  Turma sugerida agora para esta academia.
                </p>
              ) : (
                <p className="mt-4 text-[12px] text-muted-foreground">
                  Você escolheu esta turma. A sugerida agora é{" "}
                  {recommended?.name ?? "—"}.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 border border-border bg-card sm:grid-cols-4">
            <Kpi k="Aguardando" v={String(waiting.length)} hint="aluno confirmou" />
            <Kpi k="Validados" v={String(validated.length)} hint="no tatame" />
            <Kpi
              k="Vagas"
              v={cap ? String(open) : "—"}
              hint={cap ? `de ${cap}` : "sem limite"}
              warn={full}
            />
            <Kpi
              k="Habituais fora"
              v={String(habitualMissing.length)}
              hint="≥3 aulas nesta turma"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              className="sm:max-w-xs"
              placeholder="Buscar na chamada"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {waiting.length > 0 && !needle ? (
                <Button
                  type="button"
                  onClick={() => {
                    const n = store.validatePending(classId);
                    toast.success(
                      n === 1 ? "1 presença validada." : `${n} presenças validadas.`,
                    );
                  }}
                >
                  Validar quem confirmou ({waiting.length})
                </Button>
              ) : null}
              {habitualMissing.length > 0 && !needle ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const n = store.checkInMany(
                      habitualMissing.map((s) => s.id),
                      classId,
                      "manual",
                    );
                    toast.success(
                      n === 1
                        ? "1 habitual validado na porta."
                        : `${n} habituais validados na porta.`,
                    );
                  }}
                >
                  Validar habituais ({habitualMissing.length})
                </Button>
              ) : null}
            </div>
          </div>

          {visitors.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-[13px] font-medium">Visitantes</h2>
              {visitors.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between border border-border bg-card px-3 py-3 text-sm"
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

          <Group
            title="Aguardando aceite"
            count={waiting.length}
            empty="Ninguém confirmou no app ainda. Quem marcar aparece aqui para você validar."
          >
            {waiting.map((s) => {
              const row = presentByStudent.get(s.id)!;
              return (
                <RosterRow
                  key={s.id}
                  student={s}
                  attendance={row}
                  session={cls}
                  overdue={store.overdueFor(s.id).length > 0}
                  missing={isOverdue(s, store.attendance)}
                  action={
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          store.validateCheckIn(s.id, classId);
                          toast.success(`${s.name} validado.`);
                        }}
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          store.markNoShow(s.id, classId);
                          toast.message(`${s.name} marcado como não veio.`);
                        }}
                      >
                        Não veio
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </Group>

          <Group title="Validados no tatame" count={validated.length} empty="Ninguém validado nesta aula ainda.">
            {validated.map((s) => {
              const row = presentByStudent.get(s.id)!;
              return (
                <RosterRow
                  key={s.id}
                  student={s}
                  attendance={row}
                  session={cls}
                  overdue={store.overdueFor(s.id).length > 0}
                  missing={isOverdue(s, store.attendance)}
                  action={
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          store.markNoShow(s.id, classId);
                          toast.message(`${s.name} saiu da lista — não treinou.`);
                        }}
                      >
                        Não veio
                      </Button>
                    </div>
                  }
                />
              );
            })}
          </Group>

          <Group
            title="Habituais ausentes"
            count={habitualMissing.length}
            empty="Os que costumam vir nesta turma já estão na lista — ou ninguém tem histórico suficiente."
          >
            {habitualMissing.map((s) => (
              <RosterRow
                key={s.id}
                student={s}
                overdue={store.overdueFor(s.id).length > 0}
                missing={isOverdue(s, store.attendance)}
                action={
                  <Button
                    size="sm"
                    disabled={full}
                    onClick={() => {
                      store.checkIn(s.id, classId, "manual");
                      toast.success(`${s.name} validado na porta.`);
                    }}
                  >
                    Validar
                  </Button>
                }
              />
            ))}
          </Group>

          <Group title="Demais da divisão" count={others.length}>
            {others.map((s) => (
              <RosterRow
                key={s.id}
                student={s}
                overdue={store.overdueFor(s.id).length > 0}
                missing={isOverdue(s, store.attendance)}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={full}
                    onClick={() => {
                      store.checkIn(s.id, classId, "manual");
                      toast.success(`${s.name} validado na porta.`);
                    }}
                  >
                    Validar
                  </Button>
                }
              />
            ))}
          </Group>

          {noShows.length > 0 ? (
          <Group title="Não vieram" count={noShows.length}>
            {noShows.map((s) => (
              <RosterRow
                key={s.id}
                student={s}
                attendance={noShowByStudent.get(s.id)}
                overdue={store.overdueFor(s.id).length > 0}
                missing={isOverdue(s, store.attendance)}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={full}
                    onClick={() => {
                      store.checkIn(s.id, classId, "manual");
                      toast.success(`${s.name} voltou — validado.`);
                    }}
                  >
                    Veio sim
                  </Button>
                }
              />
            ))}
          </Group>
          ) : null}
        </>
      )}

      <FrequenciaMes />
    </div>
  );
}

function ghostStudent(row: Attendance): Student {
  return {
    id: row.studentId,
    academyId: row.academyId,
    userId: "",
    name: "Aluno do app",
    email: "",
    phone: "",
    birthDate: "",
    division: "adult",
    belt: "white",
    stripes: 0,
    joinDate: attendanceDay(row.date),
    lastPromotionDate: attendanceDay(row.date),
    status: "active",
    monthlyFee: 0,
    notes: "Confirmou no app — a ficha ainda não bateu com a lista.",
    avatarHue: 12,
  };
}

function Kpi({
  k,
  v,
  hint,
  warn,
}: {
  k: string;
  v: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="border-l border-border px-4 py-3 first:border-l-0">
      <p className="text-[11px] text-muted-foreground">{k}</p>
      <p className={`mt-1 text-[20px] font-medium tabular-nums ${warn ? "text-destructive" : ""}`}>
        {v}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Group({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-medium">{title}</h2>
        <span className="text-[12px] text-muted-foreground tabular-nums">{count}</span>
      </div>
      {count === 0 ? (
        empty ? (
          <p className="border border-dashed border-border bg-card px-3 py-4 text-sm text-muted-foreground">
            {empty}
          </p>
        ) : null
      ) : (
        <div className="divide-y divide-border border border-border bg-card">{children}</div>
      )}
    </section>
  );
}

function RosterRow({
  student,
  attendance,
  session,
  overdue,
  missing,
  action,
}: {
  student: Student;
  attendance?: Attendance;
  session?: ClassSession;
  overdue: boolean;
  missing: boolean;
  action: React.ReactNode;
}) {
  const late =
    attendance && session ? isLateCheckIn(session, attendance.checkedInAt) : false;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <PersonAvatar name={student.name} hue={student.avatarHue} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
          {attendance ? (
            <>
              <span>
                {formatTime(attendance.checkedInAt)} · {methodLabel(attendance.method)}
              </span>
              {late ? <span className="text-destructive">Atrasado</span> : null}
              <span>{statusLabel(attendance)}</span>
            </>
          ) : (
            <span>{student.phone}</span>
          )}
          {student.status === "trial" ? <span>Experimental</span> : null}
          {overdue ? <span className="text-destructive">Mensalidade</span> : null}
          {missing && !attendance ? <span>Sumiu</span> : null}
        </p>
      </div>
      {action}
    </div>
  );
}

function Visitante({ classId, disabled }: { classId: string; disabled?: boolean }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const fee = store.academy.dropInFee || 40;

  return (
    <>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
        Visitante
      </Button>
      <FormDialog open={open} onClose={() => setOpen(false)} title="Aula avulsa">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !classId) return;
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
            Quem veio de outra academia. Taxa da academia: {brl(fee)}.
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
      n: store.attendance.filter(
        (a) => a.studentId === s.id && a.date.startsWith(month) && isValidated(a),
      ).length,
    }))
    .sort((a, b) => b.n - a.n);

  return (
    <section className="surface p-5">
      <h2 className="text-[14px] font-medium">Frequência do mês</h2>
      <div className="mt-3 divide-y divide-border">
        {rows.map(({ s, n }) => (
          <div key={s.id} className="flex items-center justify-between py-2 text-sm">
            <span>{s.name}</span>
            <span className={n === 0 ? "text-destructive" : "text-muted-foreground"}>
              {n} treino{n === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
