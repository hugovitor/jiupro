"use client";

import Link from "next/link";

export function LgpdConsent({
  checked,
  onChange,
  student = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  student?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 text-xs leading-relaxed text-white/45">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-transparent accent-red-600"
      />
      <span>
        {student
          ? "Autorizo esta academia a tratar meus dados para matrícula, presença, faixa e cobrança. Li os "
          : "Li e aceito os "}
        <Link href="/termos" className="font-bold text-white underline underline-offset-2">
          Termos
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="font-bold text-white underline underline-offset-2">
          Política de privacidade
        </Link>{" "}
        (LGPD).
      </span>
    </label>
  );
}
