export function mapAuthError(message?: string) {
  const raw = message ?? "";
  const msg = raw.toLowerCase();
  if (
    /over_email_send_rate_limit|email rate limit|rate.?limit exceeded|too many requests|429/.test(
      msg,
    )
  ) {
    return "Muitos e-mails neste momento. Espere uns minutos e tente de novo. Se continuar, fale no WhatsApp de suporte.";
  }
  if (
    /error sending recovery email|unexpected_failure|error sending.*email|smtp|unable to send|failed to send/.test(
      msg,
    )
  ) {
    return "O e-mail de senha não saiu. Sem domínio no Resend o Supabase manda só uns poucos por hora — espere 1 hora ou fale no WhatsApp de suporte.";
  }
  if (/already|registered|exists/.test(msg)) {
    return "Este e-mail já tem senha. Entre no login.";
  }
  if (/invalid login|invalid credentials|invalid_grant/.test(msg)) {
    return "E-mail ou senha não conferem.";
  }
  if (/email not confirmed|not confirmed/.test(msg)) {
    return "Esta conta ainda não entrou. Tente de novo em instantes; se não for, use outro e-mail.";
  }
  return raw.trim() || "Não deu para entrar.";
}
