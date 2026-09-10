export function mapAuthError(message?: string) {
  const raw = message ?? "";
  const msg = raw.toLowerCase();
  if (
    /over_email_send_rate_limit|email rate limit|rate.?limit exceeded|too many requests|429/.test(
      msg,
    )
  ) {
    return "Muitos cadastros neste momento. Espere uns minutos e tente de novo. Se continuar, fale no WhatsApp da academia.";
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
