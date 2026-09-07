import { brl, formatDay, monthLabel } from "./format";
import type { Academy, AcademyEvent, Payment, Student } from "./types";

export function digitsBR(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("55")) return d;
  return `55${d}`;
}

export function waHref(phone: string, text: string) {
  return `https://wa.me/${digitsBR(phone)}?text=${encodeURIComponent(text)}`;
}

export function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

export function overdueMessage(
  academy: Academy,
  student: Student,
  payment: Payment,
) {
  const who = student.guardianName
    ? firstName(student.guardianName)
    : firstName(student.name);
  const kid = student.guardianName ? ` do(a) ${firstName(student.name)}` : "";
  return `Oi ${who}, aqui é a ${academy.name}. A mensalidade${kid} de ${monthLabel(payment.month)} (${brl(payment.amount)}) está em aberto.${
    payment.asaasInvoiceUrl
      ? ` Pague no Pix da fatura: ${payment.asaasInvoiceUrl}`
      : ` Pix: ${academy.pixKey} (${academy.pixName}).`
  } Qualquer dúvida, estamos no tatame. Oss.`;
}

export function comebackMessage(academy: Academy, student: Student) {
  return `Oi ${firstName(student.name)}, sentimos sua falta nos treinos da ${academy.name}. Tem turma hoje — vem quando puder. Oss.`;
}

export function trialMessage(academy: Academy, student: Student) {
  return `Oi ${firstName(student.guardianName ?? student.name)}, valeu pela aula experimental na ${academy.name}. Se quiser seguir, a mensalidade é ${brl(student.monthlyFee)}. Pix: ${academy.pixKey}. Oss.`;
}

export function birthdayMessage(academy: Academy, student: Student) {
  return `Parabéns, ${firstName(student.name)}! A ${academy.name} deseja um ótimo aniversário. Oss.`;
}

export function eventInviteMessage(
  academy: Academy,
  student: Student,
  event: AcademyEvent,
) {
  const who = student.guardianName
    ? firstName(student.guardianName)
    : firstName(student.name);
  const fee = event.fee
    ? ` Inscrição ${brl(event.fee)}. Pix: ${academy.pixKey}.`
    : "";
  return `Oi ${who}, a ${academy.name} confirma: ${event.title} em ${formatDay(event.date)} às ${event.time} (${event.place}).${fee} Confirma se vem? Oss.`;
}

/** Hash estável de 4 dígitos. Presença usa classCode(aula), não o slug sozinho. */
export function dayCode(date: string, salt: string) {
  let h = 2166136261;
  const src = `${date}|${salt}`;
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String(1000 + (h >>> 0) % 9000);
}
