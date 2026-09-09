"use client";

import { BeltMark } from "@/components/brand";
import { PRODUCT_MARK } from "@/lib/brand";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#080808",
          color: "#fff",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <BeltMark />
          <span style={{ fontWeight: 900, letterSpacing: "-0.04em", fontSize: 18 }}>
            {PRODUCT_MARK}
          </span>
        </div>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "#f87171",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          Sistema indisponível
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "12px 0 0", letterSpacing: "-0.04em" }}>
          O sistema não conseguiu abrir.
        </h1>
        <p style={{ maxWidth: 360, fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          Recarregue a página. Alunos e mensalidades da academia continuam
          salvos.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 20,
            height: 48,
            padding: "0 24px",
            border: 0,
            borderRadius: 12,
            background: "#dc2626",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
