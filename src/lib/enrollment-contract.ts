import { isOnRoster } from "./attendance";
import type { Academy, Attendance, Student } from "./types";

export const CONTRACT_DISCLAIMER =
  "Isto registra o aceite no app da academia. Não é assinatura digital qualificada (ICP-Brasil).";

export const CONTRACT_LOCK_MESSAGE =
  "Falta assinar o contrato da academia no seu perfil. Experimental pode treinar uma vez; o professor ainda pode te colocar na lista no tatame.";

export type ContractStatus = "none" | "pending" | "signed" | "stale";
export type ContractSigner = "student" | "guardian";

const MIN_BODY = 80;
const MAX_BODY = 20_000;

export function defaultEnrollmentContract(academyName: string) {
  const house = academyName.trim() || "a academia";
  return `Contrato de matrícula — ${house}

1. Este contrato é da academia com o aluno (ou o responsável, no kids). Não é o termo de uso do sistema TatameX.

2. A mensalidade é paga no Pix da academia. O cartão do TatameX cobra só o plano de gestão da casa.

3. O aluno segue as regras do tatame: higiene, respeito e horário. A academia pode recusar treino em atraso, sem atestado válido ou fora da chamada.

4. Jiu-Jitsu envolve contato e risco de lesão. O aluno (ou o responsável) declara estar apto e assume esse risco.

5. A academia pode usar foto e vídeo de treino e evento para divulgação da própria casa, salvo pedido escrito em contrário.

6. Dados da ficha (nome, WhatsApp, nascimento, responsável no kids) ficam com a academia para gestão, presença e cobrança, nos termos da LGPD.

7. No kids, quem aceita este contrato é o responsável legal.

Ao tocar em Assinar, a pessoa confirma que leu e concorda com esta versão.`;
}

export function normalizeEnrollmentContract(body: string) {
  const text = body.replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  if (text.length < MIN_BODY) {
    return { error: "O contrato está curto demais. Escreva as regras da casa." };
  }
  if (text.length > MAX_BODY) {
    return { error: "O contrato passou do limite. Enxugue o texto." };
  }
  return text;
}

export function hasPublishedContract(
  academy: Pick<Academy, "contractBody" | "contractVersion">,
) {
  return Boolean((academy.contractBody ?? "").trim()) && (academy.contractVersion ?? 0) > 0;
}

export function contractStatus(
  student: Pick<Student, "contractSignedVersion">,
  academy: Pick<Academy, "contractBody" | "contractVersion">,
): ContractStatus {
  if (!hasPublishedContract(academy)) return "none";
  const signed = student.contractSignedVersion ?? 0;
  if (signed <= 0) return "pending";
  if (signed === academy.contractVersion) return "signed";
  return "stale";
}

export function contractLabel(
  student: Pick<Student, "contractSignedVersion" | "contractSignedAt" | "contractSignedBy">,
  academy: Pick<Academy, "contractBody" | "contractVersion">,
) {
  const status = contractStatus(student, academy);
  if (status === "none") return "Sem contrato publicado";
  if (status === "pending") return "Falta assinar";
  if (status === "stale") return `Versão antiga (v${student.contractSignedVersion})`;
  return `Assinado v${academy.contractVersion}`;
}

export function studentNeedsContractSignature(
  student: Pick<Student, "contractSignedVersion" | "status">,
  academy: Pick<Academy, "contractBody" | "contractVersion">,
) {
  if (student.status === "inactive") return false;
  const status = contractStatus(student, academy);
  return status === "pending" || status === "stale";
}

export function trainedCountForContract(
  attendance: Attendance[],
  studentIds: string | Iterable<string>,
) {
  const ids = typeof studentIds === "string" ? new Set([studentIds]) : new Set(studentIds);
  if (!ids.size || (ids.size === 1 && ids.has(""))) return 0;
  return attendance.filter((row) => ids.has(row.studentId) && isOnRoster(row)).length;
}

export function applyContractSignature(
  student: Pick<Student, "name" | "division" | "guardianName">,
  academy: Pick<Academy, "contractVersion">,
  at = new Date().toISOString(),
) {
  const error = contractSignerError(student);
  if (error) return { error };
  const as: ContractSigner = student.division === "kids" ? "guardian" : "student";
  const by =
    as === "guardian" ? (student.guardianName ?? "").trim() : student.name.trim();
  return {
    contractSignedVersion: academy.contractVersion,
    contractSignedAt: at,
    contractSignedBy: by,
    contractSignedAs: as,
  };
}

export function studentBlockedByContract(
  student: Pick<Student, "id" | "status" | "contractSignedVersion">,
  academy: Pick<Academy, "contractBody" | "contractVersion">,
  trainedCount: number,
) {
  if (!studentNeedsContractSignature(student, academy)) return false;
  if (student.status === "trial" && trainedCount < 1) return false;
  return true;
}

export function contractSignerError(
  student: Pick<Student, "division" | "guardianName">,
) {
  if (student.division === "kids") {
    const guardian = (student.guardianName ?? "").trim();
    if (guardian.length < 2) {
      return "No kids, o responsável precisa estar na ficha para assinar.";
    }
  }
  return null;
}

export function nextContractVersion(
  academy: Pick<Academy, "contractBody" | "contractVersion">,
  nextBody: string,
) {
  const current = (academy.contractBody ?? "").trim();
  const version = academy.contractVersion ?? 0;
  if (!nextBody.trim()) return version;
  if (current === nextBody.trim() && version > 0) return version;
  return version + 1;
}
