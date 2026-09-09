"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptLgpdNotice, lgpdNoticeAccepted } from "@/lib/lgpd";

export function LgpdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!lgpdNoticeAccepted());
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#0b0b0b]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs leading-relaxed text-white/55">
          Guardamos sessão e dados da academia neste aparelho para o app funcionar. Sem cookie de
          anúncio. CPF, WhatsApp e dados de menor ficam na ficha da casa.{" "}
          <Link href="/privacidade" className="font-bold text-white underline underline-offset-2">
            Política de privacidade
          </Link>
          .
        </p>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            acceptLgpdNotice();
            setShow(false);
          }}
        >
          Entendi
        </Button>
      </div>
    </div>
  );
}
