export function captchaSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function captchaSecretKey() {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
}

export function captchaRequired() {
  return Boolean(captchaSecretKey());
}

export async function verifyCaptchaToken(token: string | undefined, ip: string) {
  const secret = captchaSecretKey();
  if (!secret) return { ok: true as const };
  if (!token?.trim()) {
    return { ok: false as const, error: "Confirme que você não é um robô." };
  }
  try {
    const body = new URLSearchParams({
      secret,
      response: token.trim(),
      remoteip: ip,
    });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    if (!data.success) {
      return { ok: false as const, error: "Captcha inválido. Atualize a página e tente de novo." };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Não deu para validar o captcha agora." };
  }
}
