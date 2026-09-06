const STORAGE = "jiupro.asaas.v1";

export type AsaasBrowserConfig = {
  apiKey: string;
  webhookToken?: string;
};

export function getAsaasBrowserConfig(): AsaasBrowserConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AsaasBrowserConfig;
    if (parsed.apiKey?.startsWith("$aact_")) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveAsaasBrowserConfig(cfg: AsaasBrowserConfig | null) {
  if (typeof window === "undefined") return;
  if (!cfg) localStorage.removeItem(STORAGE);
  else localStorage.setItem(STORAGE, JSON.stringify(cfg));
  window.dispatchEvent(new Event("jiupro-asaas"));
}

export function subscribeAsaasConfig(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("jiupro-asaas", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("jiupro-asaas", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function isAsaasConfiguredInBrowser() {
  return Boolean(getAsaasBrowserConfig()?.apiKey);
}
