"use client";

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
          fontFamily: "system-ui, sans-serif",
          background: "#f3f2f1",
          color: "#201f1e",
          textAlign: "center",
          padding: 24,
        }}
      >
        <p style={{ fontSize: 12, letterSpacing: "0.18em", color: "#605e5c" }}>
          JIUPRO
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "12px 0 0" }}>
          O sistema não conseguiu abrir.
        </h1>
        <p style={{ maxWidth: 360, fontSize: 14, color: "#605e5c" }}>
          Recarregue a página. Os dados da academia continuam na nuvem se o
          Supabase estiver ligado.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 16,
            height: 40,
            padding: "0 16px",
            border: 0,
            background: "#c41e3a",
            color: "#fff",
            fontSize: 14,
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
