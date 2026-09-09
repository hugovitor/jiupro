export const SUPPORT_PHONE_DISPLAY = "(61) 98629-8327";
export const SUPPORT_PHONE_E164 = "5561986298327";

export function supportWhatsAppHref(text?: string) {
  const message =
    text ?? "Olá, vim pelo TatameX e preciso de suporte.";
  return `https://wa.me/${SUPPORT_PHONE_E164}?text=${encodeURIComponent(message)}`;
}
