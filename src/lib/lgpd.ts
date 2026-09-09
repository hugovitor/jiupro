import type { AppState, Student } from "@/lib/types";
import { PRODUCT_NAME } from "@/lib/brand";

export const LGPD_CONSENT_KEY = "tatamex.lgpd.notice.v1";
const LEGACY_CONSENT_KEYS = ["ponteira.lgpd.notice.v1"];

export function lgpdNoticeAccepted() {
  if (typeof window === "undefined") return true;
  if (localStorage.getItem(LGPD_CONSENT_KEY) === "1") return true;
  return LEGACY_CONSENT_KEYS.some((key) => localStorage.getItem(key) === "1");
}

export function acceptLgpdNotice() {
  localStorage.setItem(LGPD_CONSENT_KEY, "1");
}

export function studentPortability(student: Student, state: AppState) {
  const pays = state.payments.filter((p) => p.studentId === student.id);
  const attendance = state.attendance.filter((a) => a.studentId === student.id);
  return {
    exportedAt: new Date().toISOString(),
    product: PRODUCT_NAME,
    academy: {
      name: state.academy.name,
      city: state.academy.city,
      state: state.academy.state,
    },
    student: {
      name: student.name,
      email: student.email,
      phone: student.phone,
      guardianName: student.guardianName ?? "",
      birthDate: student.birthDate,
      division: student.division,
      belt: student.belt,
      stripes: student.stripes,
      joinDate: student.joinDate,
      status: student.status,
      cpf: student.cpf ?? "",
    },
    payments: pays.map((p) => ({
      month: p.month,
      amount: p.amount,
      status: p.status,
    })),
    attendanceCount: attendance.length,
  };
}

export function academyPortability(state: AppState) {
  return {
    exportedAt: new Date().toISOString(),
    product: PRODUCT_NAME,
    academy: {
      name: state.academy.name,
      slug: state.academy.slug,
      city: state.academy.city,
      state: state.academy.state,
      address: state.academy.address,
      phone: state.academy.phone,
      instagram: state.academy.instagram,
    },
    users: state.users.map((u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
    })),
    students: state.students.map((s) => studentPortability(s, state).student),
    classes: state.classes.map((c) => ({
      name: c.name,
      weekday: c.weekday,
      startTime: c.startTime,
      division: c.division,
    })),
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function deletionWhatsAppText(kind: "academy" | "student", label: string) {
  if (kind === "academy") {
    return `Olá. Sou o responsável pela academia ${label} no ${PRODUCT_NAME}. Quero exercer o direito de exclusão (LGPD, art. 18): apagar a conta, alunos, presenças e cobranças desta casa no servidor.`;
  }
  return `Olá. Sou ${label}, aluno no ${PRODUCT_NAME}. Quero apagar meu acesso e meus dados pessoais no app (LGPD, art. 18).`;
}
