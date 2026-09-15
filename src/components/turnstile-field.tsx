"use client";

import { useEffect, useId, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

export function turnstileEnabled() {
  return Boolean(SITE_KEY);
}

export function TurnstileField({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const widgetId = useId();
  const [ready, setReady] = useState(false);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    let rendered: string | null = null;

    function mount() {
      const el = document.getElementById(widgetId);
      if (!el || !window.turnstile || cancelled) return;
      rendered = window.turnstile.render(el, {
        sitekey: SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
      });
      setReady(true);
    }

    if (window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.onload = () => mount();
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", mount);
      }
    }

    return () => {
      cancelled = true;
      if (rendered && window.turnstile) {
        try {
          window.turnstile.remove(rendered);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, [widgetId]);

  if (!SITE_KEY) return null;

  return (
    <div className="space-y-1.5">
      <div id={widgetId} />
      {!ready ? <p className="text-[11px] text-white/35">Carregando verificação…</p> : null}
    </div>
  );
}
