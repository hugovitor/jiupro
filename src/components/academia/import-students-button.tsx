"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseStudentCsv, STUDENT_CSV_TEMPLATE } from "@/lib/import-students";
import { studentCapMessage } from "@/lib/plan-access";
import { useStore } from "@/lib/store";

export function ImportStudentsButton() {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const { rows, errors } = parseStudentCsv(text);
      if (rows.length === 0) {
        toast.error(errors[0] || "Planilha vazia. Use nome, whatsapp, faixa, mensalidade.");
        return;
      }
      const added = store.importStudents(rows);
      if (added === 0) {
        toast.error(studentCapMessage(store.academy));
        return;
      }
      toast.success(
        added === rows.length
          ? `${added} aluno(s) importado(s).`
          : `${added} importado(s). O plano não cabe o resto.`,
      );
      if (errors.length) toast.message(errors.slice(0, 3).join(" "));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Importando…" : "Importar CSV"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          const blob = new Blob([STUDENT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "alunos-tatamex.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        Modelo
      </Button>
    </>
  );
}
