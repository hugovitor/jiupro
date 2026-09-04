import { AlunoShell } from "@/components/aluno/shell";

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AlunoShell>{children}</AlunoShell>;
}
